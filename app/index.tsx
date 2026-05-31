import "./globals.css";
import React from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const C = {
  coffee: "#C8956A",
  cream: "#F0EBE3",
  soft: "#8B8F9E",
  border: "rgba(255,255,255,0.11)",
};

export default function Index() {
  return (
    <LinearGradient
      colors={["#04091A", "#0B1728", "#060E1E"]}
      style={styles.container}
    >
      <View style={styles.logoWrap}>
        <Image
          source={require("../assets/images/dressup_ai.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.appName}>dressflow.ai</Text>

      <Link href="/login" asChild>
        <Pressable
          style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0 }]}
        >
          <Text style={styles.ctaBtnText}>Go !</Text>
        </Pressable>
      </Link>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  logoWrap: { marginBottom: 50 },
  logo: { width: width * 0.6, height: 180 },
  appName: { fontSize: 15, color: C.cream, letterSpacing: 2, marginBottom: 48 },
  ctaBtn: {
    width: 140,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
    borderRadius: 32,
    paddingVertical: 17,
  },
  ctaBtnText: {
    color: C.cream,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
