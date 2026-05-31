import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
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

const C = {
  green: "#2D6A4F",
  coffee: "#C8956A",
  cream: "#F0EBE3",
  soft: "#8B8F9E",
  khaki: "#8B8760",
  border: "rgba(255,255,255,0.11)",
};

export default function HairstyleScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [refUri, setRefUri] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async (setter: (uri: string) => void) => {
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
    });
    if (!res.canceled && res.assets[0]) setter(res.assets[0].uri);
  };

  const analyzeHairstyle = async () => {
    if (!imageUri) {
      Alert.alert("Photo requise", "Ajoute d'abord une photo de toi.");
      return;
    }
    if (!prompt.trim()) {
      Alert.alert("Description requise", "Décris la coiffure souhaitée.");
      return;
    }
    setLoading(true);
    try {
      const refInfo = refUri
        ? " J'ai aussi fourni une image de référence."
        : "";
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
      setResults(
        (data.choices?.[0]?.message?.content ?? "")
          .split("\n")
          .filter((l: string) => l.trim().length > 2),
      );
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
    setResults([]);
  };

  return (
    <LinearGradient
      colors={["#0B1728", "#0C1F35", "#091525"]}
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
            <Text style={styles.headerTitle}>Hairstyle</Text>
            <Text style={styles.headerSub}>
              Simulation coiffure par intelligence artificielle
            </Text>
          </View>

          {!imageUri ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyHint}>
                Ajoute ta photo pour commencer
              </Text>
              <TouchableOpacity
                onPress={() => pickImage(setImageUri)}
                activeOpacity={0.82}
              >
                <View style={styles.addButton}>
                  <Ionicons name="add" size={52} color={C.green} />
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
                <TouchableOpacity
                  onPress={() => pickImage(setImageUri)}
                  style={styles.changeBtn}
                >
                  <View style={styles.changeBtnBlur}>
                    <Ionicons name="camera-outline" size={16} color={C.cream} />
                    <Text style={styles.changeBtnText}>Changer</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={reset} style={styles.closeBtn}>
                  <View style={styles.closeBtnBlur}>
                    <Ionicons name="close" size={16} color="#E05555" />
                  </View>
                </TouchableOpacity>
              </View>

              {!refUri ? (
                <TouchableOpacity
                  onPress={() => pickImage(setRefUri)}
                  style={{ marginBottom: 16 }}
                >
                  <View style={styles.refAddBtn}>
                    <Ionicons
                      name="add-circle-outline"
                      size={22}
                      color={C.khaki}
                    />
                    <Text style={styles.refAddText}>
                      Ajouter une image de référence coiffure
                    </Text>
                    <Text style={styles.refAddSub}>optionnel</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.refWrap}>
                  <Image
                    source={{ uri: refUri }}
                    style={styles.refImage}
                    resizeMode="cover"
                  />
                  <View style={styles.refOverlay}>
                    <Text style={styles.refLabel}>Référence coiffure</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setRefUri(null)}
                    style={styles.refClose}
                  >
                    <View style={styles.closeBtnBlur}>
                      <Ionicons name="close" size={14} color="#E05555" />
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.inputCard}>
                <Text style={styles.inputLabel}>
                  Décris la coiffure désirée
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: boucles naturelles volume, dégradé court sur les côtés..."
                  placeholderTextColor={C.soft}
                  value={prompt}
                  onChangeText={setPrompt}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  onPress={analyzeHairstyle}
                  disabled={loading}
                  style={[styles.generateBtn, loading && { opacity: 0.55 }]}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={C.cream} size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="sparkles-outline"
                        size={18}
                        color={C.cream}
                      />
                      <Text style={styles.generateBtnText}>
                        Analyser le style
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {results.length > 0 && (
                <View style={styles.resultsCard}>
                  <View style={styles.resultsHeader}>
                    <Ionicons name="leaf-outline" size={18} color={C.green} />
                    <Text style={styles.resultsTitle}>
                      Recommandations coiffure
                    </Text>
                  </View>
                  {results.map((line, i) => (
                    <View key={i} style={styles.resultRow}>
                      <Text style={styles.resultText}>{line}</Text>
                    </View>
                  ))}
                  <TouchableOpacity
                    onPress={analyzeHairstyle}
                    disabled={loading}
                    style={styles.regenBtn}
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={15}
                      color={C.green}
                    />
                    <Text style={[styles.regenBtnText, { color: C.green }]}>
                      Régénérer
                    </Text>
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
    fontSize: 30,
    fontWeight: "800",
    color: "#F0EBE3",
    letterSpacing: 1.6,
  },
  headerSub: { fontSize: 13, color: "#8B8F9E", marginTop: 5 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyHint: {
    fontSize: 15,
    color: "#8B8F9E",
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
    marginBottom: 14,
  },
  image: { width: "100%", height: 300, borderRadius: 22 },
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
  closeBtn: {
    position: "absolute",
    top: 12,
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
  refAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.09)",
    gap: 10,
  },
  refAddText: { flex: 1, color: C.soft, fontSize: 14 },
  refAddSub: { fontSize: 11, color: C.khaki },
  refWrap: {
    marginBottom: 14,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    height: 130,
  },
  refImage: { width: "100%", height: 130 },
  refOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  refLabel: { color: C.cream, fontSize: 11, fontWeight: "600" },
  refClose: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 16,
    overflow: "hidden",
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
    backgroundColor: C.green,
    borderRadius: 30,
    paddingVertical: 14,
    marginTop: 18,
    gap: 8,
  },
  generateBtnText: { color: C.cream, fontWeight: "800", fontSize: 15 },
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
  regenBtnText: { fontSize: 13, fontWeight: "600" },
});
