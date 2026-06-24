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
  bg: "#511f2e",
  coffee: "#f4913f",
  cream: "#F0EBE3",
  soft: "#c4c7d0",
  border: "rgba(255,255,255,0.11)",
};

export default function AccueilScreen() {
  const insets = useSafeAreaInsets();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [attachUri, setAttachUri] = useState<string | null>(null);
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

  const pickImage = async () => {
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

  const generateStyle = async () => {
    if (!prompt.trim() || !imageBase64) return;
    setLoading(true);
    try {
      const maskNote =
        strokes.length > 0
          ? ` L'utilisateur a marqué ${strokes.length} zone(s) sur la photo pour indiquer les zones à modifier en priorité.`
          : "";
      const messages: any[] = [
        {
          role: "system",
          content:
            "Tu es dressflow.ai, un styliste IA de luxe ultra-précis. Génères une liste numérotée de 5 modifications vestimentaires concrètes, photo-réalistes, avec couleurs exactes, matières, coupes et marques suggérées. Réponds uniquement en français.",
        },
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
            {
              type: "text",
              text: `En analysant cette photo, propose 5 modifications vestimentaires précises selon : "${prompt}".${maskNote}`,
            },
          ],
        },
      ];
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${XAI_API_KEY}`,
        },
        body: JSON.stringify({ model: "grok-3", messages, max_tokens: 700 }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const text: string = data.choices?.[0]?.message?.content ?? "";
      Alert.alert("Suggestions de style", text);
    } catch (err: any) {
      Alert.alert("Erreur IA", err.message ?? "Impossible de contacter l'IA.");
    } finally {
      setLoading(false);
    }
  };

  const pickAttach = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) setAttachUri(res.assets[0].uri);
  };

  const reset = () => {
    setImageUri(null);
    setImageBase64(null);
    setAttachUri(null);
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
          <TouchableOpacity onPress={pickImage} activeOpacity={0.82} style={styles.addButton}>
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

            {attachUri && (
              <View style={[styles.attachWrap, { bottom: insets.bottom + 110 }]}>
                <Image source={{ uri: attachUri }} style={styles.attachImg} resizeMode="cover" />
                <TouchableOpacity style={styles.attachClose} onPress={() => setAttachUri(null)}>
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

            <TouchableOpacity onPress={pickImage} style={[styles.changeBtn, { top: insets.top + 14 }]}>
              <View style={styles.changeBtnBlur}>
                <Ionicons name="camera-outline" size={16} color={C.cream} />
                <Text style={styles.changeBtnText}>Changer</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={reset} style={[styles.resetBtn, { top: insets.top + 14 }]}>
              <View style={styles.resetBtnBlur}>
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
                  onPress={pickAttach}
                  style={[styles.toolBtn, attachUri && styles.toolBtnAttachActive]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="attach" size={20} color={attachUri ? "#FFE700" : C.cream} />
                  <Text style={[styles.toolLabel, attachUri && { color: "#FFE700" }]}>
                    Attacher
                  </Text>
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
                  placeholder="Décris le style souhaité..."
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={prompt}
                  onChangeText={setPrompt}
                  returnKeyType="send"
                  onSubmitEditing={generateStyle}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={generateStyle}
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
  container: { flex: 1, backgroundColor: "#51311f" },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
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
  inputLayer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  inputBar: { marginHorizontal: 16, gap: 8 },
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
    borderColor: "rgba(255,255,255,0.15)",
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
