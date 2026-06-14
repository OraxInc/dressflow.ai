import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useContext } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StripedBackground } from "../components/StripedBackground";
import { SettingsContext, SettingsProvider } from "./context/SettingsContext";
import "./globals.css";

function RootLayoutContent() {
  const { theme } = useContext(SettingsContext);

  return (
    <>
      <StatusBar
        style={theme.statusBarStyle}
        backgroundColor="transparent"
        translucent
      />
      <View style={{ flex: 1 }}>
        {theme.mode === "dark" && <StripedBackground />}
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
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <RootLayoutContent />
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
