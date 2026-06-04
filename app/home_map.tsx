import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TabView } from "react-native-tab-view";

import { TabFocusProvider } from "./context/TabFocusContext";
import { NeutralBlurView } from "../components/NeutralBlurView";
import Hairstyle from "./tab/cheveux";
import FaceSwap from "./tab/faceswap";
import Inpaint from "./tab/inpaint";
import Param from "./tab/param";
import Accueil from "./tab/style";

const { width } = Dimensions.get("window");

const C = {
  bg: "#0B1728",
  active: "#C8956A",
  inactive: "#4A5875",
  activeBg: "rgba(200,149,106,0.14)",
};

type TabRoute = {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export default function HomeMap() {
  const [index, setIndex] = useState(0);

  const routes = useMemo<TabRoute[]>(
    () => [
      { key: "inpaint", title: "Inpaint", icon: "color-wand-outline" },
      { key: "home", title: "Style", icon: "shirt-outline" },
      { key: "hair", title: "Cheveux", icon: "cut-outline" },
      { key: "faceswap", title: "FaceSwap", icon: "person-circle-outline" },
      { key: "settings", title: "Réglages", icon: "settings-outline" },
    ],
    [],
  );

  const sceneMap: Record<string, React.ComponentType<any>> = useMemo(() => ({
    inpaint: Inpaint,
    home: Accueil,
    hair: Hairstyle,
    faceswap: FaceSwap,
    settings: Param,
  }), []);

  const renderScene = useCallback(({ route }: { route: TabRoute }) => {
    const Scene = sceneMap[route.key];
    if (!Scene) return null;
    return (
      <TabFocusProvider value={routes[index].key === route.key}>
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <Scene />
        </View>
      </TabFocusProvider>
    );
  }, [sceneMap, routes, index]);

  useEffect(() => {
    if (index >= routes.length) setIndex(0);
  }, [index, routes.length]);

  return (
    <View style={{ flex: 1 }}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width }}
        style={{ backgroundColor: "transparent" }}
        swipeEnabled
        renderTabBar={() => null}
        lazy
      />

      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
        <View style={styles.navBar}>
          {routes.map((route, i) => {
            const active = index === i;
            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => setIndex(i)}
                style={styles.navItem}
                activeOpacity={0.75}
              >
                <View
                  style={[styles.iconWrap, active && styles.iconWrapActive]}
                >
                  <Ionicons
                    name={route.icon}
                    size={22}
                    color={active ? C.active : C.inactive}
                  />
                </View>
                <Text style={[styles.label, active && styles.labelActive]}>
                  {route.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "transparent",
  },
  navBar: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgb(255, 255, 255)",
    backgroundColor: "rgb(255, 255, 255)",
    overflow: "hidden",
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: 50,
    height: 42,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  iconWrapActive: {
    backgroundColor: C.activeBg,
  },
  label: {
    fontSize: 10,
    color: C.inactive,
    marginTop: 2,
    fontWeight: "500",
  },
  labelActive: {
    color: C.active,
    fontWeight: "700",
  },
});
