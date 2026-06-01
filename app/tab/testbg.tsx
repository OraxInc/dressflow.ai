import React from "react";
import { StyleSheet, View } from "react-native";
import { StripedBackground } from "../../components/StripedBackground";

export default function TestBgScreen() {
  return (
    <View style={styles.container}>
      <StripedBackground />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
