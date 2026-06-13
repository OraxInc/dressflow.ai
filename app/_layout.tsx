import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "./globals.css";
import React from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StripedBackground } from "../components/StripedBackground";
import { SettingsProvider } from "./context/SettingsContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        {/*
          style="light"  → icônes blancs (parfait sur fond sombre)
          backgroundColor="transparent" → laisse transparaître la couleur
          de la page courante derrière la barre (edge-to-edge Android)
        */}
        <StatusBar style="light" backgroundColor="transparent" translucent />
        <View style={{ flex: 1 }}>
          <StripedBackground />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "transparent" },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="home_map" />
          </Stack>
        </View>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
