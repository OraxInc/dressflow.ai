import React, { useMemo } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Désactiver le zoom (ex: pendant le dessin sur inpaint) */
  enabled?: boolean;
}

const SPRING = { damping: 18, stiffness: 220 };

export function ZoomableView({ children, style, enabled = true }: Props) {
  const scale      = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx         = useSharedValue(0);
  const ty         = useSharedValue(0);
  const savedTx    = useSharedValue(0);
  const savedTy    = useSharedValue(0);

  const gesture = useMemo(() => {
    const pinch = Gesture.Pinch()
      .onUpdate((e) => {
        "worklet";
        scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 5));
      })
      .onEnd(() => {
        "worklet";
        savedScale.value = scale.value;
        if (scale.value < 1.05) {
          scale.value = withSpring(1, SPRING);
          savedScale.value = 1;
          tx.value = withSpring(0, SPRING);
          ty.value = withSpring(0, SPRING);
          savedTx.value = 0;
          savedTy.value = 0;
        }
      })
      .enabled(enabled);

    const pan = Gesture.Pan()
      .onUpdate((e) => {
        "worklet";
        if (scale.value <= 1) return;
        tx.value = savedTx.value + e.translationX;
        ty.value = savedTy.value + e.translationY;
      })
      .onEnd(() => {
        "worklet";
        savedTx.value = tx.value;
        savedTy.value = ty.value;
      })
      .enabled(enabled);

    // Double-tap : zoom 2.5× si normal, reset si déjà zoomé
    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDelay(250)
      .onEnd((e) => {
        "worklet";
        if (scale.value > 1) {
          scale.value = withSpring(1, SPRING);
          savedScale.value = 1;
          tx.value = withSpring(0, SPRING);
          ty.value = withSpring(0, SPRING);
          savedTx.value = 0;
          savedTy.value = 0;
        } else {
          scale.value = withSpring(2.5, SPRING);
          savedScale.value = 2.5;
          // Centre le zoom sur le point de tap
          tx.value = withSpring((e.x - 200) * -1.5, SPRING);
          ty.value = withSpring((e.y - 400) * -1.5, SPRING);
          savedTx.value = tx.value;
          savedTy.value = ty.value;
        }
      })
      .enabled(enabled);

    return Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));
  }, [enabled]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Reanimated.View style={[style, animStyle]}>
        {children}
      </Reanimated.View>
    </GestureDetector>
  );
}
