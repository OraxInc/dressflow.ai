import React from "react";
import { StyleSheet, View } from "react-native";

const STRIPES = [
  "#0B1728",
  "#2D6A4F",
  "#C8956A",
  "#8B8760",
  "#D9C8B4",
  "#ffffff",
];

export function StripedBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <View style={styles.container}>
        {STRIPES.map((color) => (
          <View
            key={color}
            style={[styles.stripe, { backgroundColor: color }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  stripe: {
    flex: 1,
  },
});
