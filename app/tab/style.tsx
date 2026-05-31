import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { XAI_API_KEY } from "../../lib/apiKeys";

const { width } = Dimensions.get("window");

const C = {
  bg: "#0B1728",
  coffee: "#C8956A",
  coffeeDark: "#A87555",
  green: "#2D6A4F",
  cream: "#F0EBE3",
  soft: "#8B8F9E",
  khaki: "#8B8760",
  border: "rgba(255,255,255,0.11)",
};

export default function AccueilScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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
      setResults([]);
      setPrompt("");
    }
  };

  const generateStyle = async () => {
    if (!prompt.trim()) {
      Alert.alert(
        "Décris ton style",
        "Ajoute une description pour générer des suggestions.",
      );
      return;
    }
    setLoading(true);
    try {
      const messages: any[] = [
        {
          role: "system",
          content:
            "Tu es dressflow.ai, un styliste IA de luxe ultra-précis. Quand l'utilisateur décrit un style, tu génères une liste numérotée de 5 modifications vestimentaires concrètes, photo-réalistes, avec couleurs exactes, matières, coupes et marques suggérées. Réponds uniquement en français. Sois précis, inventif et luxueux.",
        },
      ];
      if (imageBase64) {
        messages.push({
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
              text: `En analysant cette photo, propose 5 modifications vestimentaires précises selon : "${prompt}". Chaque suggestion inclut le vêtement, la couleur exacte, la matière et comment le porter.`,
            },
          ],
        });
      } else {
        messages.push({
          role: "user",
          content: `Propose 5 modifications de style vestimentaires photo-réalistes basées sur : "${prompt}". Chaque suggestion inclut le vêtement, couleur exacte, matière et comment le porter.`,
        });
      }
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
      setResults(text.split("\n").filter((l) => l.trim().length > 2));
    } catch (err: any) {
      Alert.alert("Erreur IA", err.message ?? "Impossible de contacter l'IA.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImageUri(null);
    setImageBase64(null);
    setPrompt("");
    setResults([]);
  };

  return (
    <LinearGradient
      colors={["#015c45", "#0E2040", "#0B1728"]}
      style={styles.flex}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>dressflow.ai</Text>
            <Text style={styles.headerSub}>
              Transforme ton style en un instant
            </Text>
          </View>

          {!imageUri ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyHint}>
                Sélectionne une photo pour commencer
              </Text>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.82}>
                <View style={styles.addButton}>
                  <Ionicons name="add" size={52} color={C.coffee} />
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.imageWrap}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  resizeMode="cover"
                />
                <TouchableOpacity onPress={pickImage} style={styles.changeBtn}>
                  <View style={styles.changeBtnBlur}>
                    <Ionicons name="camera-outline" size={16} color={C.cream} />
                    <Text style={styles.changeBtnText}>Changer</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={reset} style={styles.resetBtn}>
                  <View style={styles.resetBtnBlur}>
                    <Ionicons name="close" size={16} color="#E05555" />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.inputCard}>
                <Text style={styles.inputLabel}>Décris le style souhaité</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: tenue décontractée chic avec veste kaki et boots..."
                  placeholderTextColor={C.soft}
                  value={prompt}
                  onChangeText={setPrompt}
                  multiline
                  numberOfLines={3}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={generateStyle}
                  disabled={loading}
                  style={[
                    styles.generateBtn,
                    loading && styles.generateBtnDisabled,
                  ]}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={C.cream} size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="flash-outline"
                        size={18}
                        color={C.cream}
                      />
                      <Text style={styles.generateBtnText}>
                        Générer le style
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {results.length > 0 && (
                <View style={styles.resultsCard}>
                  <View style={styles.resultsHeader}>
                    <Ionicons
                      name="diamond-outline"
                      size={18}
                      color={C.coffee}
                    />
                    <Text style={styles.resultsTitle}>
                      Suggestions de style
                    </Text>
                  </View>
                  {results.map((line, i) => (
                    <View key={i} style={styles.resultRow}>
                      <Text style={styles.resultText}>{line}</Text>
                    </View>
                  ))}
                  <TouchableOpacity
                    onPress={generateStyle}
                    disabled={loading}
                    style={styles.regenBtn}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={15}
                      color={C.coffee}
                    />
                    <Text style={styles.regenBtnText}>Régénérer</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 50,
    paddingTop: 64,
  },
  header: { alignItems: "center", marginBottom: 36 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: C.cream,
    letterSpacing: 2,
  },
  headerSub: { fontSize: 13, color: C.soft, marginTop: 5, letterSpacing: 0.4 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyHint: {
    fontSize: 15,
    color: C.soft,
    marginBottom: 36,
    textAlign: "center",
  },
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
  imageWrap: {
    position: "relative",
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 18,
  },
  image: { width: "100%", height: 340, borderRadius: 22 },
  changeBtn: {
    position: "absolute",
    top: 12,
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
    top: 12,
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
  inputCard: {
    borderRadius: 18,
    overflow: "hidden",
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  inputLabel: {
    color: C.cream,
    fontWeight: "700",
    marginBottom: 12,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  input: {
    color: C.cream,
    fontSize: 15,
    lineHeight: 22,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 8,
    minHeight: 72,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.coffee,
    borderRadius: 30,
    paddingVertical: 14,
    marginTop: 18,
    gap: 8,
  },
  generateBtnDisabled: { opacity: 0.55 },
  generateBtnText: {
    color: C.cream,
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  resultsCard: {
    borderRadius: 18,
    overflow: "hidden",
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  resultsTitle: { fontSize: 16, fontWeight: "700", color: C.cream },
  resultRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  resultText: { color: C.cream, fontSize: 14, lineHeight: 22 },
  regenBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  regenBtnText: { color: C.coffee, fontSize: 13, fontWeight: "600" },
});
