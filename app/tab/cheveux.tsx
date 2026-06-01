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
import {
    getAndroidBlurProps,
    NeutralBlurView,
} from "../../components/NeutralBlurView";
import { XAI_API_KEY } from "../../lib/apiKeys";

const C = {
  coffee: "#C8956A",
  cream: "#F0EBE3",
  soft: "#b8e6d6",
  border: "rgba(255,255,255,0.13)",
};

export default function HairstyleScreen() {
  const insets = useSafeAreaInsets();
  const blurTargetRef = useRef<View | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [refUri, setRefUri] = useState<string | null>(null);
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

  const pickImage = async (setter: (uri: string) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "Active l'accès à la galerie dans les réglages.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) {
      setter(res.assets[0].uri);
      if (setter === setImageUri) {
        setPrompt("");
        inputAnim.setValue(0);
        showInput();
      }
    }
  };

  const analyzeHairstyle = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const refInfo = refUri ? " J'ai aussi fourni une image de référence." : "";
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${XAI_API_KEY}` },
        body: JSON.stringify({
          model: "grok-3",
          messages: [
            {
              role: "system",
              content:
                "Tu es un expert en coiffure et stylisme capillaire de luxe. Tes recommandations sont précises, photo-réalistes. Tu mentionnes les techniques, les produits professionnels et l'entretien. Réponds en français avec 5 recommandations numérotées.",
            },
            {
              role: "user",
              content: `Je veux cette coiffure : "${prompt}".${refInfo} Donne-moi 5 recommandations précises avec : technique de coiffage, produits recommandés, durée de tenue et entretien quotidien.`,
            },
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
    setRefUri(null);
    setPrompt("");
    inputAnim.setValue(0);
  };

  const isFocused    = useTabFocused();
  const imageOpacity = useImageFade(imageUri, isFocused);
  const translateY = inputAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] });
  const opacity = inputAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const backgroundBlurProps = getAndroidBlurProps(blurTargetRef) as any;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {!imageUri ? (
        <View style={styles.centerWrap}>
          <Text style={styles.emptyHint}>Sélectionne une photo pour commencer</Text>
          <TouchableOpacity
            onPress={() => pickImage(setImageUri)}
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
            <Animated.Image source={{ uri: imageUri }} style={[styles.image, { opacity: imageOpacity }]} resizeMode="cover" />

            {/* Reference image — bottom-left overlay */}
            {refUri && (
              <View style={styles.refWrap}>
                <Image source={{ uri: refUri }} style={styles.refImage} resizeMode="cover" />
                <TouchableOpacity style={styles.refClose} onPress={() => setRefUri(null)}>
                  <Ionicons name="close-circle" size={18} color="#E05555" />
                </TouchableOpacity>
              </View>
            )}

            {/* Changer button */}
            <TouchableOpacity
              onPress={() => pickImage(setImageUri)}
              style={[styles.changeBtn, { top: insets.top + 14 }]}
            >
              <View style={styles.changeBtnBlur}>
                <Ionicons name="camera-outline" size={16} color={C.cream} />
                <Text style={styles.changeBtnText}>Changer</Text>
              </View>
            </TouchableOpacity>

            {/* Close button */}
            <TouchableOpacity
              onPress={reset}
              style={[styles.closeBtn, { top: insets.top + 14 }]}
            >
              <View style={styles.closeBtnBlur}>
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
                { marginBottom: insets.bottom + 16, opacity, transform: [{ translateY }] },
              ]}
            >
              <View style={styles.toolRow}>
                <TouchableOpacity
                  onPress={() => pickImage(setRefUri)}
                  style={[styles.attachBtn, refUri && styles.attachBtnActive]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="attach" size={20} color={refUri ? "#FFE700" : C.cream} />
                  <Text style={[styles.attachLabel, refUri && { color: "#FFE700" }]}>Attacher</Text>
                </TouchableOpacity>
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
  container: { ...StyleSheet.absoluteFillObject, backgroundColor: "#1a0535" },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyHint: { fontSize: 15, color: C.soft, marginBottom: 36, textAlign: "center" },
  addButton: {
    width: 150,
    height: 150,
    borderRadius: 36,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  addButtonBlur: { ...StyleSheet.absoluteFillObject },
  imageWrap: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000",
  },
  image: { ...StyleSheet.absoluteFillObject },
  refWrap: {
    position: "absolute",
    bottom: 80,
    left: 16,
    width: 90,
    height: 90,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: C.border,
  },
  refImage: { width: "100%", height: "100%" },
  refClose: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  refAddBtn: {
    position: "absolute",
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  refAddText: { color: C.soft, fontSize: 12, fontWeight: "500" },
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
  inputLayer: { position: "absolute", bottom: 0, left: 0, right: 0 },
  inputBar: { marginHorizontal: 16, gap: 8 },
  toolRow: { flexDirection: "row" },
  attachBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18,
    borderWidth: 1, borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  attachBtnActive: { borderColor: "rgba(255,231,0,0.55)", backgroundColor: "rgba(255,231,0,0.1)" },
  attachLabel: { color: C.cream, fontSize: 12, fontWeight: "600" },
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
  input: { flex: 1, color: C.cream, fontSize: 15, paddingVertical: 8, minHeight: 42 },
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
