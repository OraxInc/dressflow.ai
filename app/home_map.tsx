import { Ionicons } from "@expo/vector-icons";
import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { TabView } from "react-native-tab-view";
import { SettingsContext } from "./context/SettingsContext";

import { TabFocusProvider } from "./context/TabFocusContext";
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
  cream: "#F0EBE3",
  soft: "#8B8F9E",
  coffee: "#C8956A",
};

type TabRoute = {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const PACKS = [
  { label: "100 diamants", price: "$0.99", amount: 100 },
  { label: "500 diamants", price: "$3.99", amount: 500 },
  { label: "1 000 diamants", price: "$6.99", amount: 1000 },
];

export default function HomeMap() {
  const insets = useSafeAreaInsets();
  const { theme } = useContext(SettingsContext);
  const [index, setIndex] = useState(0);
  const [credits, setCredits] = useState(250);
  const [modalVisible, setModal] = useState(false);

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

  const sceneMap: Record<string, React.ComponentType<any>> = useMemo(
    () => ({
      inpaint: Inpaint,
      home: Accueil,
      hair: Hairstyle,
      faceswap: FaceSwap,
      settings: Param,
    }),
    [],
  );

  const renderScene = useCallback(
    ({ route }: { route: TabRoute }) => {
      const Scene = sceneMap[route.key];
      if (!Scene) return null;
      return (
        <TabFocusProvider value={routes[index].key === route.key}>
          <View style={{ flex: 1, backgroundColor: "#000" }}>
            <Scene />
          </View>
        </TabFocusProvider>
      );
    },
    [sceneMap, routes, index],
  );

  useEffect(() => {
    if (index >= routes.length) setIndex(0);
  }, [index, routes.length]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.screen }}>
      {/* Barre de crédits flottante */}
      <TouchableOpacity
        onPress={() => setModal(true)}
        style={[styles.creditBar, { top: insets.top + 10 }]}
        activeOpacity={0.75}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.creditCount}>{credits}</Text>
        <Ionicons name="diamond-outline" size={22} color="#fff" />
      </TouchableOpacity>

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

      {/* ── Modal crédits custom ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setModal(false)}
      >
        {/* Backdrop — clic extérieur ferme le modal */}
        <Pressable style={styles.backdrop} onPress={() => setModal(false)}>
          {/* stopPropagation pour que le clic sur la card ne ferme pas */}
          <Pressable style={styles.card} onPress={() => {}}>
            <View style={styles.cardHeader}>
              <Ionicons name="diamond" size={28} color={C.coffee} />
              <Text style={styles.cardTitle}>Recharger des diamants</Text>
            </View>

            <Text style={styles.cardSub}>
              Solde actuel :{" "}
              <Text style={{ color: C.coffee, fontWeight: "800" }}>
                {credits} diamants
              </Text>
            </Text>

            {/* Packs one-shot */}
            {PACKS.map((pack) => (
              <TouchableOpacity
                key={pack.amount}
                style={styles.packRow}
                activeOpacity={0.78}
                onPress={() => {
                  setCredits((c) => c + pack.amount);
                  setModal(false);
                }}
              >
                <View style={styles.packLeft}>
                  <Ionicons name="diamond-outline" size={20} color={C.coffee} />
                  <Text style={styles.packLabel}>{pack.label}</Text>
                </View>
                <Text style={styles.packPrice}>{pack.price}</Text>
              </TouchableOpacity>
            ))}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Abonnement */}
            <TouchableOpacity
              style={styles.subRow}
              activeOpacity={0.82}
              onPress={() => {
                setCredits((c) => c + 5000);
                setModal(false);
              }}
            >
              <View style={styles.packLeft}>
                <Ionicons name="infinite-outline" size={22} color="#fff" />
                <View>
                  <Text style={styles.subLabel}>Abonnement mensuel</Text>
                  <Text style={styles.subMeta}>5 000 diamants / mois</Text>
                </View>
              </View>
              <Text style={styles.subPrice}>$45 / mois</Text>
            </TouchableOpacity>

            {/* Annuler */}
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.7}
              onPress={() => setModal(false)}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  /* Crédit bar */
  creditBar: {
    position: "absolute",
    left: 16,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  creditCount: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    minWidth: 28,
  },

  /* Nav */
  safeArea: { backgroundColor: "transparent" },
  navBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.86)",
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconWrap: {
    width: 50,
    height: 42,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: { backgroundColor: C.activeBg },
  label: { fontSize: 10, color: C.inactive, marginTop: 2, fontWeight: "500" },
  labelActive: { color: C.active, fontWeight: "700" },

  /* Modal */
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#0F1E38",
    borderRadius: 32,
    padding: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.cream,
    letterSpacing: 0.3,
  },
  cardSub: {
    fontSize: 14,
    color: C.soft,
    marginBottom: 22,
  },

  /* Packs */
  packRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  packLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  packLabel: { fontSize: 16, color: C.cream, fontWeight: "600" },
  packPrice: { fontSize: 16, color: C.coffee, fontWeight: "800" },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 14,
  },

  /* Abonnement */
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.coffee,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 18,
  },
  subLabel: { fontSize: 16, color: "#fff", fontWeight: "700" },
  subMeta: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  subPrice: { fontSize: 17, color: "#fff", fontWeight: "900" },

  /* Annuler */
  cancelBtn: { alignItems: "center", paddingVertical: 4 },
  cancelText: { fontSize: 15, color: C.soft, fontWeight: "600" },
});
