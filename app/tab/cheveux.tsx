import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { NeutralBlurView } from "../../components/NeutralBlurView";
import { ZoomableView } from "../../components/ZoomableView";
import { useImageFade } from "../../hooks/useImageFade";
import { XAI_API_KEY } from "../../lib/apiKeys";
import { useTabFocused } from "../context/TabFocusContext";

const AnimatedPath = Reanimated.createAnimatedComponent(Path);
type Tool = "magic" | "brush" | null;
type Stroke = { d: string; color: string; width: number; glow: boolean };

const C = {
  coffee: "#C8956A",
  cream: "#F0EBE3",
  soft: "#b8e6d6",
  border: "rgba(255,255,255,0.13)",
};

export default function HairstyleScreen() {
  const insets = useSafeAreaInsets();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [refUri, setRefUri] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [tool, setTool] = useState<Tool>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);

  const inputAnim = useRef(new Animated.Value(0)).current;

  const livePath = useSharedValue("M0,0");
  const liveVis = useSharedValue(0);
  const lastX = useSharedValue(0);
  const lastY = useSharedValue(0);
  const toolRef = useRef<Tool>(null);

  const showInput = () => {
    Animated.spring(inputAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  };

  const pickMainImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "Active l'accès à la galerie dans les réglages.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      base64: true,
    });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setImageBase64(res.assets[0].base64 ?? null);
      setStrokes([]);
      setTool(null);
      toolRef.current = null;
      setPrompt("");
      inputAnim.setValue(0);
      showInput();
    }
  };

  const pickRef = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) setRefUri(res.assets[0].uri);
  };

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
          const dx = e.x - lastX.value;
          const dy = e.y - lastY.value;
          if (dx * dx + dy * dy < 9) return;
          livePath.value = livePath.value + ` L${e.x.toFixed(1)},${e.y.toFixed(1)}`;
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
  );

  const animatedPathProps = useAnimatedProps(() => ({
    d: livePath.value,
    strokeOpacity: liveVis.value,
  }));

  const analyzeHairstyle = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const refInfo = refUri ? " J'ai aussi fourni une image de référence." : "";
      const maskNote =
        strokes.length > 0
          ? ` L'utilisateur a marqué ${strokes.length} zone(s) capillaire(s) sur la photo.`
          : "";
      const promptText = `Je veux cette coiffure : "${prompt}".${refInfo}${maskNote} Donne-moi 5 recommandations précises avec : technique de coiffage, produits recommandés, durée de tenue et entretien quotidien.`;

      const userContent: any = imageBase64
        ? [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "low",
              },
            },
            { type: "text", text: promptText },
          ]
        : promptText;

      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "grok-3",
          messages: [
            {
              role: "system",
              content:
                "Tu es un expert en coiffure et stylisme capillaire de luxe. Tes recommandations sont précises, photo-réalistes. Tu mentionnes les techniques, les produits professionnels et l'entretien. Réponds en français avec 5 recommandations numérotées.",
            },
            { role: "user", content: userContent },
          ],
          max_tokens: 750,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const text: string = data.choices?.[0]?.message?.content ?? "";
      Alert.alert("Recommandations coiffure", text);
    } catch (err: any) {
      Alert.alert("Erreur IA", err.message ?? "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImageUri(null);
    setImageBase64(null);
    setRefUri(null);
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
  const imageOpacity = useImageFade(imageUri, isFocused);
  const imageAnimStyle = useAnimatedStyle(() => ({ opacity: imageOpacity.value }));
  const shouldShowDrawingLayer = tool !== null || strokes.length > 0;
  const translateY = inputAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] });
  const opacity = inputAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {!imageUri ? (
        <View style={styles.centerWrap}>
          <Text style={styles.emptyHint}>Sélectionne une photo pour commencer</Text>
          <TouchableOpacity onPress={pickMainImage} activeOpacity={0.82} style={styles.addButton}>
            <NeutralBlurView pointerEvents="none" style={styles.addButtonBlur} intensity={50} />
            <Ionicons name="add" size={52} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.imageWrap}>
            <ZoomableView style={StyleSheet.absoluteFill} enabled={!tool}>
              <Reanimated.View style={[StyleSheet.absoluteFill, imageAnimStyle]}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  resizeMode="cover"
                />
              </Reanimated.View>
            </ZoomableView>

            {refUri && (
              <View style={[styles.refWrap, { bottom: insets.bottom + 110 }]}>
                <Image source={{ uri: refUri }} style={styles.refImage} resizeMode="cover" />
                <TouchableOpacity style={styles.refClose} onPress={() => setRefUri(null)}>
                  <Ionicons name="close-circle" size={18} color="#E05555" />
                </TouchableOpacity>
              </View>
            )}

            {shouldShowDrawingLayer && (
              <GestureDetector gesture={drawGesture}>
                <View
                  style={StyleSheet.absoluteFill}
                  collapsable={false}
                  pointerEvents={tool ? "box-only" : "none"}
                >
                  <Svg style={styles.drawingSvg}>
                    {strokes.map((s, i) =>
                      s.glow ? (
                        <React.Fragment key={i}>
                          <Path
                            d={s.d}
                            stroke="#FFB300"
                            strokeOpacity={0.34}
                            strokeWidth={22}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <Path
                            d={s.d}
                            stroke="#FFFFFF"
                            strokeOpacity={0.92}
                            strokeWidth={s.width}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </React.Fragment>
                      ) : (
                        <Path
                          key={i}
                          d={s.d}
                          stroke={s.color}
                          strokeWidth={s.width}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      ),
                    )}
                    <AnimatedPath
                      animatedProps={animatedPathProps}
                      stroke={tool === "magic" ? "#FFFFFF" : "rgba(255,255,255,0.62)"}
                      strokeWidth={tool === "magic" ? 3 : 28}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </GestureDetector>
            )}

            <TouchableOpacity
              onPress={pickMainImage}
              style={[styles.changeBtn, { top: insets.top + 14 }]}
            >
              <View style={styles.changeBtnBlur}>
                <Ionicons name="camera-outline" size={16} color={C.cream} />
                <Text style={styles.changeBtnText}>Changer</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={reset} style={[styles.closeBtn, { top: insets.top + 14 }]}>
              <View style={styles.closeBtnBlur}>
                <Ionicons name="close" size={16} color="#E05555" />
              </View>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={styles.inputLayer}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <Animated.View
              style={[
                styles.inputBar,
                { marginBottom: insets.bottom + 16, opacity, transform: [{ translateY }] },
              ]}
            >
              <View style={styles.toolRow}>
                <TouchableOpacity
                  onPress={pickRef}
                  style={[styles.toolBtn, refUri && styles.toolBtnAttachActive]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="attach" size={20} color={refUri ? "#FFE700" : C.cream} />
                  <Text style={[styles.toolLabel, refUri && { color: "#FFE700" }]}>Attacher</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => selectTool("magic")}
                  style={[styles.toolBtn, tool === "magic" && styles.toolBtnMagicActive]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="sparkles"
                    size={20}
                    color={tool === "magic" ? "#FF3CAC" : C.cream}
                  />
                  <Text style={[styles.toolLabel, tool === "magic" && { color: "#FF3CAC" }]}>
                    Magic
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => selectTool("brush")}
                  style={[styles.toolBtn, tool === "brush" && styles.toolBtnBrushActive]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="brush"
                    size={20}
                    color={tool === "brush" ? "#00BFFF" : C.cream}
                  />
                  <Text style={[styles.toolLabel, tool === "brush" && { color: "#00BFFF" }]}>
                    Crayon
                  </Text>
                </TouchableOpacity>

                {strokes.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setStrokes([])}
                    style={styles.toolBtn}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={20} color="#E05555" />
                    <Text style={[styles.toolLabel, { color: "#E05555" }]}>Effacer</Text>
                  </TouchableOpacity>
                )}
              </View>

              <NeutralBlurView style={styles.inputBlur} intensity={10}>
                <TextInput
                  style={styles.input}
                  placeholder="Décris la coiffure souhaitée..."
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={prompt}
                  onChangeText={setPrompt}
                  returnKeyType="send"
                  onSubmitEditing={analyzeHairstyle}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={analyzeHairstyle}
                  disabled={loading || !prompt.trim()}
                  style={[styles.genBtn, (!prompt.trim() || loading) && styles.genBtnDisabled]}
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
  container: { flex: 1, backgroundColor: "#1a0535" },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 88,
  },
  emptyHint: {
    fontSize: 15,
    color: C.soft,
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
  addButtonBlur: { ...StyleSheet.absoluteFill },
  imageWrap: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  drawingSvg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
  refWrap: {
    position: "absolute",
    left: 16,
    width: 90,
    height: 90,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: C.border,
  },
  refImage: { width: "100%", height: "100%" },
  refClose: { position: "absolute", top: 4, right: 4 },
  changeBtn: {
    position: "absolute",
    right: 52,
    borderRadius: 20,
    overflow: "hidden",
  },
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
  closeBtn: {
    position: "absolute",
    right: 12,
    borderRadius: 20,
    overflow: "hidden",
  },
  closeBtnBlur: {
    padding: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  inputLayer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: "center",
  },
  inputBar: {
    width: "100%",
    maxWidth: 520,
    paddingHorizontal: 16,
    gap: 8,
  },
  toolRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
  },
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
