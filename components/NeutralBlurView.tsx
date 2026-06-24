import React from "react";
import { View, ViewStyle, StyleProp } from "react-native";

export const BlurTargetView = View;
export const hasModernBlurTarget = false;

export function getAndroidBlurProps() {
  return {};
}

interface NeutralBlurViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: string;
  pointerEvents?: "box-none" | "none" | "box-only" | "auto";
}

export function NeutralBlurView({
  children,
  intensity = 75,
  style,
  pointerEvents = "auto",
  ...props
}: NeutralBlurViewProps) {
  const opacity = Math.min(intensity / 100, 0.4);
  return (
    <View
      style={[
        {
          backgroundColor: `rgba(0, 0, 0, ${opacity})`,
          backdropFilter: "blur(8px)",
        },
        style,
      ]}
      pointerEvents={pointerEvents}
      {...props}
    >
      {children}
    </View>
  );
}
