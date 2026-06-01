import { useEffect, useRef } from "react";
import { Animated } from "react-native";

/**
 * Gère l'opacité de l'image selon le cycle :
 *   - Pas d'image OU onglet inactif → transparent (0)
 *   - Image uploadée ET onglet actif  → fade in 0 → 1
 *   - Onglet quitte le focus          → retour à 0 (arrière-plan flou visible)
 *   - Image fermée                    → retour à 0
 */
export function useImageFade(uri: string | null, focused: boolean, duration = 380) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (uri && focused) {
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    } else {
      // Pas d'image OU onglet perdu → transparent immédiat
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [uri, focused]);

  return opacity;
}
