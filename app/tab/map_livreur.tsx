import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { SettingsContext } from "../context/SettingsContext";

const C = {
  coffee: "#C8956A",
  green: "#2D6A4F",
  cream: "#F0EBE3",
  soft: "#8B8F9E",
  khaki: "#8B8760",
  border: "rgba(255,255,255,0.11)",
};

export default function FaceSwapScreen() {
  const { isPremium, setIsPremium } = useContext(SettingsContext);
  const [sourceUri, setSourceUri] = useState<string | null>(null);
  const [targetUri, setTargetUri] = useState<string | null>(null);
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

  const runFaceSwap = async () => {
    if (!sourceUri || !targetUri) {
      Alert.alert(
        "Photos manquantes",
        "Ajoute les deux photos pour lancer le face swap.",
      );
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setLoading(false);
    Alert.alert(
      "Bientôt disponible",
      "L'intégration du moteur Face Swap est en cours de déploiement. Tu seras notifié(e) dès que la fonctionnalité est disponible.",
    );
  };

  /* Paywall */
  if (!isPremium) {
    return (
      <LinearGradient
        colors={["#0B1728", "#100E28", "#0B1728"]}
        style={styles.flex}
      >
        <View style={styles.paywallContainer}>
          <View style={styles.paywallIcon}>
            <Ionicons
              name="lock-closed"
              size={42}
              color="rgba(200,149,106,0.6)"
            />
          </View>
          <Text style={styles.paywallTitle}>Fonctionnalité Premium</Text>
          <Text style={styles.paywallDesc}>
            Le Face Swap IA ultra-réaliste est réservé aux abonnés Premium.
            Échange ton visage dans n'importe quelle photo.
          </Text>
          <View style={styles.featuresCard}>
            {[
              "Face Swap photo-réaliste illimité",
              "Modifications de style illimitées",
              "Génération DALL-E 3 haute définition",
              "Sans publicité · Priorité de traitement",
            ].map((f, i) => (
              <Text key={i} style={styles.featureItem}>
                {f}
              </Text>
            ))}
          </View>
          <TouchableOpacity
            style={styles.upgradeBtn}
            activeOpacity={0.88}
            onPress={() => setIsPremium(true)}
          >
            <Ionicons name="diamond-outline" size={20} color={C.cream} />
            <Text style={styles.upgradeBtnText}>
              Passer Premium — 9,99 €/mois
            </Text>
          </TouchableOpacity>
          <Text style={styles.paywallMuted}>
            Annulation possible à tout moment
          </Text>
        </View>
      </LinearGradient>
    );
  }

  /* Écran Face Swap (Premium) */
  return (
    <LinearGradient
      colors={["#0B1728", "#100E28", "#0B1728"]}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.premiumBadge}>
            <Ionicons name="diamond-outline" size={12} color={C.coffee} />
            <Text style={styles.premiumBadgeText}>PREMIUM</Text>
          </View>
          <Text style={styles.headerTitle}>Face Swap AI</Text>
          <Text style={styles.headerSub}>
            Échange de visage ultra-réaliste par IA
          </Text>
        </View>

        <Text style={styles.slotLabel}>Ton visage · Photo source</Text>
        <TouchableOpacity
          onPress={() => pickImage(setSourceUri)}
          activeOpacity={0.85}
        >
          {sourceUri ? (
            <View style={styles.slotFilled}>
              <Image
                source={{ uri: sourceUri }}
                style={styles.slotImage}
                resizeMode="cover"
              />
              <View style={styles.slotBadge}>
                <Ionicons name="checkmark-circle" size={14} color={C.coffee} />
                <Text style={styles.slotBadgeText}>Source</Text>
              </View>
              <TouchableOpacity
                style={styles.slotClose}
                onPress={() => setSourceUri(null)}
              >
                <View style={styles.closeBtnBlur}>
                  <Ionicons name="close" size={14} color="#E05555" />
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.slotEmpty}>
              <Ionicons
                name="person-outline"
                size={40}
                color="rgba(200,149,106,0.5)"
              />
              <Text style={styles.slotEmptyText}>Ajouter photo source</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.arrowRow}>
          <View style={styles.arrowLine} />
          <View style={styles.arrowIcon}>
            <Ionicons name="swap-vertical-outline" size={20} color={C.coffee} />
          </View>
          <View style={styles.arrowLine} />
        </View>

        <Text style={styles.slotLabel}>Image cible · Photo de destination</Text>
        <TouchableOpacity
          onPress={() => pickImage(setTargetUri)}
          activeOpacity={0.85}
        >
          {targetUri ? (
            <View style={styles.slotFilled}>
              <Image
                source={{ uri: targetUri }}
                style={styles.slotImage}
                resizeMode="cover"
              />
              <View
                style={[
                  styles.slotBadge,
                  { backgroundColor: "rgba(45,106,79,0.3)" },
                ]}
              >
                <Ionicons name="checkmark-circle" size={14} color={C.green} />
                <Text style={[styles.slotBadgeText, { color: C.green }]}>
                  Cible
                </Text>
              </View>
              <TouchableOpacity
                style={styles.slotClose}
                onPress={() => setTargetUri(null)}
              >
                <View style={styles.closeBtnBlur}>
                  <Ionicons name="close" size={14} color="#E05555" />
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[styles.slotEmpty, { borderColor: "rgba(45,106,79,0.3)" }]}
            >
              <Ionicons
                name="images-outline"
                size={40}
                color="rgba(45,106,79,0.5)"
              />
              <Text style={styles.slotEmptyText}>Ajouter image cible</Text>
            </View>
          )}
        </TouchableOpacity>

        {sourceUri && targetUri && (
          <TouchableOpacity
            onPress={runFaceSwap}
            disabled={loading}
            style={[styles.swapBtn, loading && { opacity: 0.55 }]}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={C.cream} size="small" />
            ) : (
              <>
                <Ionicons
                  name="swap-horizontal-outline"
                  size={20}
                  color={C.cream}
                />
                <Text style={styles.swapBtnText}>Lancer le Face Swap</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
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

  paywallContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  paywallIcon: {
    width: 100,
    height: 100,
    borderRadius: 36,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.09)",
    marginBottom: 24,
  },
  paywallTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: C.cream,
    marginBottom: 12,
    textAlign: "center",
  },
  paywallDesc: {
    fontSize: 15,
    color: C.soft,
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 28,
  },
  featuresCard: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.09)",
    marginBottom: 28,
    gap: 10,
  },
  featureItem: { color: C.cream, fontSize: 14, paddingVertical: 4 },
  upgradeBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.coffee,
    borderRadius: 30,
    paddingVertical: 16,
    gap: 8,
  },
  upgradeBtnText: { color: C.cream, fontWeight: "800", fontSize: 16 },
  paywallMuted: { marginTop: 12, fontSize: 12, color: C.soft },

  header: { alignItems: "center", marginBottom: 28 },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(200,149,106,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(200,149,106,0.25)",
    marginBottom: 10,
  },
  premiumBadgeText: {
    fontSize: 10,
    color: C.coffee,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: C.cream,
    letterSpacing: 1.6,
  },
  headerSub: { fontSize: 13, color: C.soft, marginTop: 5 },

  slotLabel: {
    color: C.soft,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  slotFilled: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 4,
    position: "relative",
  },
  slotImage: { width: "100%", height: 200, borderRadius: 18 },
  slotBadge: {
    position: "absolute",
    bottom: 10,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(200,149,106,0.2)",
    gap: 5,
  },
  slotBadgeText: { color: C.coffee, fontSize: 11, fontWeight: "700" },
  slotClose: {
    position: "absolute",
    top: 10,
    right: 10,
    borderRadius: 16,
    overflow: "hidden",
  },
  closeBtnBlur: {
    padding: 7,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  slotEmpty: {
    height: 180,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(200,149,106,0.2)",
    backgroundColor: "rgba(255,255,255,0.09)",
    marginBottom: 4,
    gap: 8,
  },
  slotEmptyText: { color: C.soft, fontSize: 15, fontWeight: "600" },

  arrowRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
    gap: 10,
  },
  arrowLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.07)" },
  arrowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  swapBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.coffee,
    borderRadius: 30,
    paddingVertical: 15,
    marginTop: 18,
    gap: 8,
  },
  swapBtnText: { color: C.cream, fontWeight: "800", fontSize: 16 },
});
