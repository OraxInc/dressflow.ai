import * as ExpoBlur from "expo-blur";
import React from "react";
import { View } from "react-native";

const ExpoBlurCompat = ExpoBlur as typeof ExpoBlur & {
  BlurTargetView?: React.ComponentType<any>;
};

export const BlurTargetView = (ExpoBlurCompat.BlurTargetView ?? View) as any;
export const hasModernBlurTarget = Boolean(ExpoBlurCompat.BlurTargetView);

export function getAndroidBlurProps(blurTarget?: React.RefObject<View | null>) {
  if (!hasModernBlurTarget) return { experimentalBlurMethod: "dimezisBlurView" };
  return blurTarget
    ? {
        blurMethod: "dimezisBlurViewSdk31Plus",
        blurTarget,
      }
    : { blurMethod: "dimezisBlurViewSdk31Plus" };
}

type NeutralBlurViewProps = React.ComponentProps<typeof ExpoBlur.BlurView> & {
  blurMethod?: "none" | "dimezisBlurView" | "dimezisBlurViewSdk31Plus";
  blurTarget?: React.RefObject<View | null>;
  experimentalBlurMethod?: "none" | "dimezisBlurView";
};

export function NeutralBlurView({
  children,
  intensity = 75,
  tint = "default",
  ...props
}: NeutralBlurViewProps) {
  return (
    <ExpoBlurCompat.BlurView
      intensity={intensity}
      tint={tint}
      {...getAndroidBlurProps()}
      {...props}
    >
      {children}
    </ExpoBlurCompat.BlurView>
  );
}
