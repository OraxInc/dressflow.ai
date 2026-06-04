import "./globals.css";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const C = {
  coffee: "#C8956A",
  green: "#2D6A4F",
  cream: "#F0EBE3",
  soft: "#8B8F9E",
  khaki: "#8B8760",
  border: "rgba(255,255,255,0.11)",
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Champs requis", "Remplis tous les champs pour continuer.");
      return;
    }
    router.replace("/home_map");
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Logo compact */}
        <View style={styles.logoWrap}>
          <Image
            source={require("../assets/images/dressup_ai.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>dressflow.ai</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Connexion</Text>
          <Text style={styles.formSub}>Bienvenue ! Entre tes informations.</Text>

          {/* Email */}
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={C.soft} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Adresse email"
              placeholderTextColor={C.soft}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={C.soft} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Mot de passe"
              placeholderTextColor={C.soft}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <Pressable onPress={() => setShowPass(!showPass)} style={styles.showPassBtn}>
              <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={C.soft} />
            </Pressable>
          </View>

          <Pressable
            onPress={handleLogin}
            style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.loginBtnText}>Se connecter</Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social logins */}
          <View style={styles.socialRow}>
            <View style={styles.socialBtn}>
              <Ionicons name="logo-google" size={20} color={C.cream} />
              <Text style={styles.socialBtnText}>Google</Text>
            </View>
            <View style={styles.socialBtn}>
              <Ionicons name="logo-apple" size={20} color={C.cream} />
              <Text style={styles.socialBtnText}>Apple</Text>
            </View>
          </View>
        </View>

        {/* Lien inscription */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Pas encore de compte ? </Text>
          <Pressable>
            <Text style={[styles.footerText, { color: C.coffee, fontWeight: "700" }]}>
              S'inscrire
            </Text>
          </Pressable>
        </View>

        {/* Skip (dev) */}
        <Link href="/home_map" asChild>
          <Pressable>
            <Text style={styles.skipText}>Continuer sans compte</Text>
          </Pressable>
        </Link>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#031227e9" },
  inner: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },

  logoWrap: { alignItems: "center", marginBottom: 32 },
  logo: { width: width * 0.4, height: 70 },
  appName: { fontSize: 22, fontWeight: "800", color: C.cream, letterSpacing: 2, marginTop: 8 },

  formCard: {
    width: "100%",
    borderRadius: 22,
    overflow: "hidden",
    padding: 24,
    borderWidth: 1,
    borderColor: C.border, backgroundColor: "rgba(255, 255, 255, 0.12)",
    marginBottom: 20,
  },
  formTitle: { fontSize: 22, fontWeight: "800", color: C.cream, marginBottom: 4 },
  formSub: { fontSize: 13, color: C.soft, marginBottom: 22 },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border, 
    backgroundColor: "rgba(255, 255, 255, 0.09)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: C.cream, fontSize: 15 },
  showPassBtn: { padding: 4 },

  loginBtn: {
    backgroundColor: C.coffee,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  loginBtnText: { color: C.cream, fontWeight: "800", fontSize: 16 },

  divider: { flexDirection: "row", alignItems: "center", marginVertical: 18, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { color: C.soft, fontSize: 12 },

  socialRow: { flexDirection: "row", gap: 12 },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    overflow: "hidden",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.border, backgroundColor: "rgba(255,255,255,0.09)",
    gap: 8,
  },
  socialBtnText: { color: C.cream, fontSize: 14, fontWeight: "600" },

  footerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  footerText: { color: C.soft, fontSize: 14 },

  skipText: { color: C.khaki, fontSize: 13, opacity: 0.7 },
});
