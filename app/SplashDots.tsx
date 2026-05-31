import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

type Props = {
  index: number;
};

export default function SplashDots({ index }: Props) {
  const scrollValue = useRef(new Animated.Value(index)).current;

  useEffect(() => {
    Animated.spring(scrollValue, {
      toValue: index,
      useNativeDriver: false,
      friction: 7,
      tension: 40,
    }).start();
  }, [index]);

  // Déplacement : On aligne la pilule sur les points (espacement de 24px)
  const translateX = scrollValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, 24, 48], 
  });

  // Effet gluant : La pilule s'allonge encore plus pendant qu'elle change d'index
  const pillWidth = scrollValue.interpolate({
    inputRange: [0, 0.5, 1, 1.5, 2],
    outputRange: [38, 55, 38, 55, 38], // 38px au repos (comme ton image), 55px en mouvement
  });

  return (
    <View style={styles.container}>
      {/* Points de fond (statiques) */}
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.dotBase} />
      ))}

      {/* La Pilule Animée (Active) */}
      <Animated.View
        style={[
          styles.activePill,
          {
            width: pillWidth,
            transform: [{ translateX: translateX }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 30,
    width: 120,
    marginTop: 20,
  },
  dotBase: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.15)",
    marginHorizontal: 6,
  },
  activePill: {
    position: "absolute",
    left: 6, 
    height: 14,
    borderRadius: 7,
    backgroundColor: "#000",
  },
});