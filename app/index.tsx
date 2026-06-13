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

const { width } = Dimensions.get("window");

const C = {
  coffee: "#C8956A",
  cream: "#F0EBE3",
  soft: "#8B8F9E",
  border: "rgba(255,255,255,0.11)",
};

export default function Index() {
  return (
    <View style={styles.container}>
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
          style={styles.ctaBtn}
        >
          <Text style={styles.ctaBtnText}>Go !</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#ffffff",
  },
  logoWrap: { marginBottom: 50 },
  logo: { width: width * 0.6, height: 250 },
  appName: { fontSize: 18, color: "#0c0548", letterSpacing: 2, marginBottom: 48 },
  ctaBtn: {
    width: 90,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2b4fc5",
    borderRadius: 32,
  },
  ctaBtnText: {
    color: "white",
    fontSize: 20,
    letterSpacing: 0.5,
  },
});
