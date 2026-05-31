import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { OPENAI_API_KEY } from "../../lib/apiKeys";

const C = {
  coffee: "#C8956A",
  cream: "#F0EBE3",
  soft: "#8B8F9E",
  border: "rgba(255,255,255,0.15)",
};

export default function InpaintScreen() {
  const insets = useSafeAreaInsets();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [displayUri, setDisplayUri] = useState<string | null>(null);
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
      quality: 0.9,
      base64: true,
    });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setImageBase64(res.assets[0].base64 ?? null);
      setDisplayUri(res.assets[0].uri);
      setPrompt("");
      inputAnim.setValue(0);
      showInput();
    }
  };

  const runInpaint = async () => {
    if (!prompt.trim() || !imageBase64) return;
    setLoading(true);
    try {
      const visionResp = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
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
                  {
                    type: "text",
                    text: `Describe this image in full detail then incorporate this change: "${prompt}". Write a single DALL-E 3 prompt (200 words max) that recreates the scene with the change applied. Photorealistic, high quality. Start directly with the prompt, no intro sentence.`,
                  },
                ],
              },
            ],
            max_tokens: 320,
          }),
        },
      );
      const visionData = await visionResp.json();
      if (visionData.error) throw new Error(visionData.error.message);
      const dallePrompt: string =
        visionData.choices?.[0]?.message?.content ?? prompt;

      const imgResp = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: dallePrompt,
            n: 1,
            size: "1024x1024",
            quality: "hd",
            style: "natural",
          }),
        },
      );
      const imgData = await imgResp.json();
      if (imgData.error) throw new Error(imgData.error.message);
      const url: string | undefined = imgData.data?.[0]?.url;
      if (url) setDisplayUri(url);
      else Alert.alert("Génération échouée", "Aucune image retournée.");
    } catch (err: any) {
      Alert.alert("Erreur", err.message ?? "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImageUri(null);
    setImageBase64(null);
    setDisplayUri(null);
    setPrompt("");
    inputAnim.setValue(0);
  };

  const translateY = inputAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });
  const opacity = inputAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {displayUri ? (
        <ImageBackground
          source={{ uri: displayUri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        >
          <View style={styles.imageDim} />
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={["#0B1728", "#100E28", "#0B1728"]}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {imageUri && (
        <TouchableOpacity
          style={[styles.resetBtn, { top: insets.top + 14 }]}
          onPress={reset}
          activeOpacity={0.8}
        >
          <View style={styles.resetBtnBlur}>
            <Ionicons name="close" size={18} color={C.cream} />
          </View>
        </TouchableOpacity>
      )}

      {!imageUri && (
        <>
          <View style={styles.centerWrap}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.82}>
              <View style={styles.addButton}>
                <Ionicons name="add" size={52} color={C.coffee} />
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}

      {imageUri && (
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
            <View style={styles.inputBlur}>
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
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  resetBtn: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    borderRadius: 20,
    overflow: "hidden",
  },
  resetBtnBlur: {
    padding: 9,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  addButton: {
    width: 130,
    height: 130,
    borderRadius: 36,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  inputLayer: { position: "absolute", bottom: 0, left: 0, right: 0 },
  inputBar: { marginHorizontal: 16 },
  inputBlur: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.09)",
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
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
