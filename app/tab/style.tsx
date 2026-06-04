import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useRef, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTabFocused } from "../context/TabFocusContext";
import { useImageFade } from "../../hooks/useImageFade";
import { ZoomableView } from "../../components/ZoomableView";
import {
  getAndroidBlurProps,
  NeutralBlurView,
} from "../../components/NeutralBlurView";
import { XAI_API_KEY } from "../../lib/apiKeys";

const C = {
  bg: "#511f2e",
  coffee: "#f4913f",
  cream: "#F0EBE3",
  soft: "#c4c7d0",
  border: "rgba(255,255,255,0.11)",
};

export default function AccueilScreen() {
  const insets = useSafeAreaInsets();
  const blurTargetRef = useRef<View | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [attachUri, setAttachUri] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const inputAnim = useRef(new Animated.Value(0)).current;

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
      Alert.alert(
        "Permission requise",
        "Active l'accès à la galerie dans les réglages.",
      );
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
      setPrompt("");
      inputAnim.setValue(0);
      showInput();
    }
  };

  const generateStyle = async () => {
    if (!prompt.trim() || !imageBase64) return;
    setLoading(true);
    try {
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
              text: `En analysant cette photo, propose 5 modifications vestimentaires précises selon : "${prompt}".`,
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
    setPrompt("");
    inputAnim.setValue(0);
  };

  const isFocused = useTabFocused();
  const imageOpacity = useImageFade(imageUri, isFocused);
  const translateY = inputAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });
  const opacity = inputAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const backgroundBlurProps = getAndroidBlurProps(blurTargetRef) as any;

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
              {...backgroundBlurProps}
            />
            <Ionicons name="add" size={52} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.imageWrap}>
            <ZoomableView style={StyleSheet.absoluteFillObject}>
              <Animated.Image
                source={{ uri: imageUri }}
                style={[styles.image, { opacity: imageOpacity }]}
                resizeMode="cover"
              />
            </ZoomableView>

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
                  onPress={() => setAttachUri(null)}
                >
                  <Ionicons name="close-circle" size={18} color="#E05555" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              onPress={pickImage}
              style={[styles.changeBtn, { top: insets.top + 14 }]}
            >
              <View style={styles.changeBtnBlur}>
                <Ionicons name="camera-outline" size={16} color={C.cream} />
                <Text style={styles.changeBtnText}>Changer</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={reset}
              style={[styles.resetBtn, { top: insets.top + 14 }]}
            >
              <View style={styles.resetBtnBlur}>
                <Ionicons name="close" size={16} color="#E05555" />
              </View>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={styles.inputLayer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <Animated.View
              style={[
                styles.inputBar,
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
                    styles.attachBtn,
                    attachUri && styles.attachBtnActive,
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
                      styles.attachLabel,
                      attachUri && { color: "#FFE700" },
                    ]}
                  >
                    Attacher
                  </Text>
                </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: "#511f1f" },
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
  addButtonBlur: { ...StyleSheet.absoluteFillObject },
  imageWrap: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
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
  inputLayer: { position: "absolute", bottom: 0, left: 0, right: 0 },
  inputBar: { marginHorizontal: 16, gap: 8 },
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
  toolRow: { flexDirection: "row" },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  attachBtnActive: {
    borderColor: "rgba(255,231,0,0.55)",
    backgroundColor: "rgba(255,231,0,0.1)",
  },
  attachLabel: { color: C.cream, fontSize: 12, fontWeight: "600" },
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
});
