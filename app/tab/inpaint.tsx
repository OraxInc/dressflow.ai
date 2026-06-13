import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  runOnJS,
  useAnimatedProps,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTabFocused } from "../context/TabFocusContext";
import { useImageFade } from "../../hooks/useImageFade";
import Svg, {
  Defs,
  FeComposite,
  FeFlood,
  FeGaussianBlur,
  FeMerge,
  FeMergeNode,
  Filter,
  Path,
} from "react-native-svg";
import { ZoomableView } from "../../components/ZoomableView";
import {
  getAndroidBlurProps,
  NeutralBlurView,
} from "../../components/NeutralBlurView";
import { XAI_API_KEY } from "../../lib/apiKeys";

// Composant Path animé — mis à jour sur le UI thread, zéro bridge JS
const AnimatedPath = Reanimated.createAnimatedComponent(Path);

type Tool = "magic" | "brush" | null;
type Stroke = { d: string; color: string; width: number; glow: boolean };

const C = {
  coffee: "#C8956A",
  cream: "#F0EBE3",
  border: "rgba(255,255,255,0.15)",
};

export default function InpaintScreen() {
  const insets = useSafeAreaInsets();
  const blurTargetRef = useRef<View | null>(null);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [attachUri, setAttachUri] = useState<string | null>(null);
  const [attachB64, setAttachB64] = useState<string | null>(null);
  const [displayUri, setDisplayUri] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [tool, setTool] = useState<Tool>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);

  // inputAnim reste sur Animated (RN) — pas lié au dessin, pas de latence critique
  const inputAnim = useRef(new Animated.Value(0)).current;

  // Shared values UI thread pour le trait en cours
  const livePath = useSharedValue("M0,0");
  const liveVis = useSharedValue(0); // 0 = invisible, 1 = visible
  const lastX = useSharedValue(0);
  const lastY = useSharedValue(0);

  // toolRef : lu dans les worklets via runOnJS → pas besoin de shared value
  const toolRef = useRef<Tool>(null);

  const showInput = () =>
    Animated.spring(inputAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();

  /* ── pickImage ── */
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "Active l'accès à la galerie.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setImageBase64(res.assets[0].base64 ?? null);
      setDisplayUri(res.assets[0].uri);
      setAttachUri(null);
      setAttachB64(null);
      setStrokes([]);
      setTool(null);
      toolRef.current = null;
      setPrompt("");
      inputAnim.setValue(0);
      showInput();
    }
  };

  /* ── pickAttach ── */
  const pickAttach = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      base64: true,
    });
    if (!res.canceled && res.assets[0]) {
      setAttachUri(res.assets[0].uri);
      setAttachB64(res.assets[0].base64 ?? null);
    }
  };

  /* ── commitPath : appelé depuis UI thread via runOnJS à la fin d'un trait ── */
  const commitPath = useCallback((d: string) => {
    const t = toolRef.current;
    if (!d || !t) return;
    setStrokes((prev) => [
      ...prev,
      {
        d,
        color: t === "magic" ? "#FFFFFF" : "rgba(255,255,255,0.62)",
        width: t === "magic" ? 3 : 28,
        glow: t === "magic",
      },
    ]);
  }, []);

  /* ── Gesture worklet : s'exécute sur le UI thread natif ── */
  const drawGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onStart((e) => {
          "worklet";
          livePath.value = `M${e.x.toFixed(1)},${e.y.toFixed(1)}`;
          lastX.value = e.x;
          lastY.value = e.y;
          liveVis.value = 1;
        })
        .onUpdate((e) => {
          "worklet";
          // Seuil 3px — supprime les micro-tremblements sans perdre la fluidité
          const dx = e.x - lastX.value;
          const dy = e.y - lastY.value;
          if (dx * dx + dy * dy < 9) return; // 9 = 3²
          livePath.value =
            livePath.value + ` L${e.x.toFixed(1)},${e.y.toFixed(1)}`;
          lastX.value = e.x;
          lastY.value = e.y;
        })
        .onEnd(() => {
          "worklet";
          const d = livePath.value;
          liveVis.value = 0;
          livePath.value = "M0,0";
          runOnJS(commitPath)(d);
        })
        .enabled(tool === "magic" || tool === "brush"),
    [tool, commitPath],
  ); // reconstruit seulement quand l'outil change

  /* ── animatedProps pour le trait live ── */
  const animatedPathProps = useAnimatedProps(() => ({
    d: livePath.value,
    strokeOpacity: liveVis.value,
  }));

  /* ── runInpaint : grok-2-vision-1212 → description enrichie → aurora → image ── */
  const runInpaint = async () => {
    if (!prompt.trim() || !imageBase64) return;
    setLoading(true);
    try {
      // Étape 1 — vision : décrire l'image en détail + intégrer la modification
      const maskNote =
        strokes.length > 0
          ? ` The user painted ${strokes.length} zone(s) with a brush to indicate exactly where to apply the change.`
          : "";

      const vResp = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "grok-3",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: "low",
                  },
                },
                ...(attachB64
                  ? [
                      {
                        type: "image_url",
                        image_url: {
                          url: `data:image/jpeg;base64,${attachB64}`,
                          detail: "low",
                        },
                      },
                    ]
                  : []),
                {
                  type: "text",
                  text: `Describe this photo with full photorealistic detail: lighting, colors, textures, composition, background, subjects, clothing.${maskNote} Then write a single image-generation prompt that recreates the exact scene with only this change applied: "${prompt}". Keep every other detail identical. Output only the prompt, no intro or explanation.`,
                },
              ],
            },
          ],
          max_tokens: 500,
        }),
      });
      const vData = await vResp.json();
      if (!vResp.ok)
        throw new Error(
          vData.error?.message ??
            `Vision ${vResp.status}: ${JSON.stringify(vData)}`,
        );
      const genPrompt: string =
        vData.choices?.[0]?.message?.content?.trim() ?? prompt;

      // Étape 2 — génération image avec Aurora (modèle xAI)
      const iResp = await fetch("https://api.x.ai/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "aurora",
          prompt: genPrompt,
          n: 1,
          response_format: "url",
        }),
      });
      const iData = await iResp.json();
      if (!iResp.ok)
        throw new Error(
          iData.error?.message ?? `Generation error ${iResp.status}`,
        );

      const resultUrl: string | undefined =
        iData.data?.[0]?.url ??
        (iData.data?.[0]?.b64_json
          ? `data:image/png;base64,${iData.data[0].b64_json}`
          : undefined);

      if (resultUrl) {
        setDisplayUri(resultUrl);
        setStrokes([]);
        setTool(null);
        toolRef.current = null;
      } else {
        Alert.alert("Génération échouée", JSON.stringify(iData));
      }
    } catch (err: any) {
      Alert.alert("Erreur API", err.message ?? "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Télécharger l'image générée ── */
  const downloadImage = async () => {
    if (!displayUri) return;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission requise",
          "Autorise l'accès à la galerie pour sauvegarder.",
        );
        return;
      }

      let localUri = displayUri;

      // Si URL distante → télécharger d'abord dans le cache
      if (displayUri.startsWith("http")) {
        const filename = `dressflow_${Date.now()}.jpg`;
        const dest = FileSystem.cacheDirectory + filename;
        const dl = await FileSystem.downloadAsync(displayUri, dest);
        localUri = dl.uri;
      }
      // Si base64 → écrire dans le cache
      else if (displayUri.startsWith("data:image")) {
        const base64 = displayUri.split(",")[1];
        const dest = FileSystem.cacheDirectory + `dressflow_${Date.now()}.jpg`;
        await FileSystem.writeAsStringAsync(dest, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        localUri = dest;
      }

      await MediaLibrary.saveToLibraryAsync(localUri);
      Alert.alert("✓ Sauvegardé", "Image enregistrée dans ta galerie.");
    } catch (err: any) {
      Alert.alert("Erreur", err.message ?? "Impossible de sauvegarder.");
    }
  };

  const reset = () => {
    setImageUri(null);
    setImageBase64(null);
    setDisplayUri(null);
    setAttachUri(null);
    setAttachB64(null);
    setStrokes([]);
    setTool(null);
    toolRef.current = null;
    setPrompt("");
    inputAnim.setValue(0);
  };

  const selectTool = (t: Tool) => {
    const next = tool === t ? null : t;
    setTool(next);
    toolRef.current = next;
  };

  const isFocused = useTabFocused();
  const imageOpacity = useImageFade(displayUri ?? imageUri, isFocused);
  const translateY = inputAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [120, 0],
  });
  const opacity = inputAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const bgBlur = getAndroidBlurProps(blurTargetRef) as any;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {!imageUri ? (
        <View style={styles.centerWrap}>
          <Text style={styles.emptyHint}>
            Sélectionne une photo pour commencer
          </Text>
          <TouchableOpacity
            onPress={pickImage}
            activeOpacity={0.82}
            style={styles.addButton}
          >
            <NeutralBlurView
              pointerEvents="none"
              style={styles.addButtonBlur}
              intensity={50}
              {...bgBlur}
            />
            <Ionicons name="add" size={52} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.imageWrap}>
            <ZoomableView style={StyleSheet.absoluteFillObject} enabled={!tool}>
              <Animated.Image
                source={{ uri: displayUri ?? imageUri }}
                style={[styles.image, { opacity: imageOpacity }]}
                resizeMode="cover"
              />
            </ZoomableView>

            {/* Référence attachée */}
            {attachUri && (
              <View
                style={[styles.attachWrap, { bottom: insets.bottom + 110 }]}
              >
                <Image
                  source={{ uri: attachUri }}
                  style={styles.attachImg}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.attachClose}
                  onPress={() => {
                    setAttachUri(null);
                    setAttachB64(null);
                  }}
                >
                  <Ionicons name="close-circle" size={18} color="#E05555" />
                </TouchableOpacity>
              </View>
            )}

            {/* Canvas SVG + GestureDetector UI thread */}
            <GestureDetector gesture={drawGesture}>
              <View
                style={StyleSheet.absoluteFillObject}
                collapsable={false}
                pointerEvents={tool ? "box-only" : "none"}
              >
                <Svg style={StyleSheet.absoluteFillObject}>
                  <Defs>
                    <Filter
                      id="magicGlow"
                      x="-70%"
                      y="-70%"
                      width="240%"
                      height="240%"
                    >
                      <FeGaussianBlur
                        in="SourceAlpha"
                        stdDeviation="12"
                        result="bigBlur"
                      />
                      <FeFlood
                        floodColor="#FFB300"
                        floodOpacity="0.92"
                        result="amber"
                      />
                      <FeComposite
                        in="amber"
                        in2="bigBlur"
                        operator="in"
                        result="amberGlow"
                      />
                      <FeGaussianBlur
                        in="SourceAlpha"
                        stdDeviation="4"
                        result="innerBlur"
                      />
                      <FeFlood
                        floodColor="#FFFFFF"
                        floodOpacity="0.5"
                        result="white"
                      />
                      <FeComposite
                        in="white"
                        in2="innerBlur"
                        operator="in"
                        result="innerGlow"
                      />
                      <FeMerge>
                        <FeMergeNode in="amberGlow" />
                        <FeMergeNode in="innerGlow" />
                        <FeMergeNode in="SourceGraphic" />
                      </FeMerge>
                    </Filter>
                  </Defs>

                  {/* Traits commités (avec filtre glow sur magic) */}
                  {strokes.map((s, i) => (
                    <Path
                      key={i}
                      d={s.d}
                      stroke={s.color}
                      strokeWidth={s.width}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter={s.glow ? "url(#magicGlow)" : undefined}
                    />
                  ))}

                  {/* Trait live — UI thread, sans filtre pour 0 latence */}
                  <AnimatedPath
                    animatedProps={animatedPathProps}
                    stroke={
                      tool === "magic" ? "#FFFFFF" : "rgba(255,255,255,0.62)"
                    }
                    strokeWidth={tool === "magic" ? 3 : 28}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </GestureDetector>

            {/* Boutons haut */}
            <TouchableOpacity
              onPress={pickImage}
              style={[styles.changeBtn, { top: insets.top + 14 }]}
            >
              <View style={styles.changeBtnBlur}>
                <Ionicons name="camera-outline" size={16} color={C.cream} />
                <Text style={styles.changeBtnText}>Changer</Text>
              </View>
            </TouchableOpacity>

            {/* Télécharger — visible uniquement quand une image générée est dispo */}
            {displayUri && displayUri !== imageUri && (
              <TouchableOpacity
                onPress={downloadImage}
                style={[styles.downloadBtn, { top: insets.top + 14 }]}
              >
                <View style={styles.downloadBtnBlur}>
                  <Ionicons name="download-outline" size={16} color="#00BFFF" />
                  <Text style={styles.downloadBtnText}>Sauver</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={reset}
              style={[styles.resetBtn, { top: insets.top + 14 }]}
            >
              <View style={styles.resetBtnBlur}>
                <Ionicons name="close" size={16} color="#E05555" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Barre outils + input */}
          <KeyboardAvoidingView
            style={styles.inputLayer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <Animated.View
              style={[
                styles.inputWrap,
                {
                  marginBottom: insets.bottom + 16,
                  opacity,
                  transform: [{ translateY }],
                },
              ]}
            >
              <View style={styles.toolRow}>
                <TouchableOpacity
                  onPress={pickAttach}
                  style={[
                    styles.toolBtn,
                    attachUri && styles.toolBtnAttachActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="attach"
                    size={20}
                    color={attachUri ? "#FFE700" : C.cream}
                  />
                  <Text
                    style={[
                      styles.toolLabel,
                      attachUri && { color: "#FFE700" },
                    ]}
                  >
                    Attacher
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => selectTool("magic")}
                  style={[
                    styles.toolBtn,
                    tool === "magic" && styles.toolBtnMagicActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="sparkles"
                    size={20}
                    color={tool === "magic" ? "#FF3CAC" : C.cream}
                  />
                  <Text
                    style={[
                      styles.toolLabel,
                      tool === "magic" && { color: "#FF3CAC" },
                    ]}
                  >
                    Magic
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => selectTool("brush")}
                  style={[
                    styles.toolBtn,
                    tool === "brush" && styles.toolBtnBrushActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="brush"
                    size={20}
                    color={tool === "brush" ? "#00BFFF" : C.cream}
                  />
                  <Text
                    style={[
                      styles.toolLabel,
                      tool === "brush" && { color: "#00BFFF" },
                    ]}
                  >
                    Simple
                  </Text>
                </TouchableOpacity>

                {strokes.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setStrokes([])}
                    style={styles.toolBtn}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={20} color="#E05555" />
                    <Text style={[styles.toolLabel, { color: "#E05555" }]}>
                      Effacer
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <NeutralBlurView style={styles.inputBlur} intensity={10}>
                <TextInput
                  style={styles.input}
                  placeholder="Décris la modification..."
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={prompt}
                  onChangeText={setPrompt}
                  returnKeyType="send"
                  onSubmitEditing={runInpaint}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={runInpaint}
                  disabled={loading || !prompt.trim()}
                  style={[
                    styles.genBtn,
                    (!prompt.trim() || loading) && styles.genBtnDisabled,
                  ]}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={C.cream} size="small" />
                  ) : (
                    <Text style={styles.genBtnText}>gen</Text>
                  )}
                </TouchableOpacity>
              </NeutralBlurView>
            </Animated.View>
          </KeyboardAvoidingView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#091f3fe9",
  },

  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyHint: {
    fontSize: 15,
    color: "rgba(196,199,208,0.9)",
    marginBottom: 36,
    textAlign: "center",
  },
  addButton: {
    width: 150,
    height: 150,
    borderRadius: 36,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgb(240, 227, 227)",
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  addButtonBlur: { ...StyleSheet.absoluteFillObject },

  imageWrap: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000",
    overflow: "hidden",
  },
  image: { ...StyleSheet.absoluteFillObject },

  attachWrap: {
    position: "absolute",
    left: 16,
    width: 86,
    height: 86,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,231,0,0.6)",
  },
  attachImg: { width: "100%", height: "100%" },
  attachClose: { position: "absolute", top: 3, right: 3 },

  changeBtn: {
    position: "absolute",
    right: 52,
    borderRadius: 20,
    overflow: "hidden",
  },
  downloadBtn: {
    position: "absolute",
    left: 12,
    borderRadius: 20,
    overflow: "hidden",
  },
  downloadBtnBlur: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(0,191,255,0.4)",
    backgroundColor: "rgba(0,191,255,0.12)",
    gap: 5,
  },
  downloadBtnText: { color: "#00BFFF", fontSize: 12, fontWeight: "600" },
  changeBtnBlur: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.09)",
    gap: 5,
  },
  changeBtnText: { color: C.cream, fontSize: 12, fontWeight: "500" },
  resetBtn: {
    position: "absolute",
    right: 12,
    borderRadius: 20,
    overflow: "hidden",
  },
  resetBtnBlur: {
    padding: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.09)",
  },

  inputLayer: { position: "absolute", bottom: 0, left: 0, right: 0 },
  inputWrap: { marginHorizontal: 16, gap: 8 },

  toolRow: { flexDirection: "row", gap: 8 },
  toolBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.07)",
    gap: 3,
  },
  toolBtnAttachActive: {
    borderColor: "rgba(255,231,0,0.55)",
    backgroundColor: "rgba(255,231,0,0.1)",
  },
  toolBtnMagicActive: {
    borderColor: "rgba(255,60,172,0.55)",
    backgroundColor: "rgba(255,60,172,0.1)",
  },
  toolBtnBrushActive: {
    borderColor: "rgba(0,191,255,0.55)",
    backgroundColor: "rgba(0,191,255,0.1)",
  },
  toolLabel: { color: C.cream, fontSize: 10, fontWeight: "600" },

  inputBlur: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(12,18,30,0.25)",
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    color: C.cream,
    fontSize: 15,
    paddingVertical: 8,
    minHeight: 42,
  },
  genBtn: {
    backgroundColor: C.coffee,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginLeft: 8,
  },
  genBtnDisabled: { opacity: 0.4 },
  genBtnText: { color: C.cream, fontWeight: "800", fontSize: 14 },
});
