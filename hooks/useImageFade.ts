import { useEffect } from "react";
import { useSharedValue, withTiming } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

/**
 * Fade-in Reanimated quand uri est défini.
 * Utilise SharedValue + withTiming pour compatibilité Fabric (new arch RN 0.85).
 * L'ancien Animated.timing + useNativeDriver:false reposait sur setNativeProps
 * qui est cassé dans Fabric — les updates d'opacité n'étaient pas flushed
 * visuellement avant le prochain re-render React (d'où l'écran noir).
 */
export function useImageFade(
  uri: string | null,
  _focused?: boolean,
  duration = 380,
): SharedValue<number> {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = uri ? withTiming(1, { duration }) : 0;
  }, [uri]);

  return opacity;
}
