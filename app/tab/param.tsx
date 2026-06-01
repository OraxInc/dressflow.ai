import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  SettingsContext,
  AppLanguage,
  ExportQuality,
} from "../context/SettingsContext";

const C = {
  coffee: "#C8956A",
  green: "#2D6A4F",
  cream: "#F0EBE3",
  soft: "#8B8F9E",
  khaki: "#8B8760",
  border: "rgba(255,255,255,0.11)",
};

const LANGUAGES: { key: AppLanguage; label: string; native: string }[] = [
  { key: "fr", label: "Français", native: "Français" },
  { key: "en", label: "Anglais", native: "English" },
  { key: "es", label: "Espagnol", native: "Español" },
];

const QUALITIES: { key: ExportQuality; label: string; desc: string }[] = [
  { key: "standard", label: "Standard", desc: "512 x 512 · Rapide" },
  { key: "hd", label: "HD", desc: "1024 x 1024 · Recommandé" },
  { key: "ultra", label: "Ultra HD", desc: "1792 x 1024 · Premium" },
];

export default function ParamScreen() {
  const {
    isPremium,
    setIsPremium,
    userName,
    language,
    setLanguage,
    notificationsEnabled,
    setNotificationsEnabled,
    exportQuality,
    setExportQuality,
  } = useContext(SettingsContext);

  const [langModal, setLangModal] = useState(false);
  const [qualityModal, setQualityModal] = useState(false);

  const langLabel =
    LANGUAGES.find((l) => l.key === language)?.label ?? "Français";
  const qualityLabel =
    QUALITIES.find((q) => q.key === exportQuality)?.label ?? "HD";

  return (
    <LinearGradient
      colors={["#0c1c34eb", "#061428eb", "#0b1c35eb"]}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={38} color={C.coffee} />
            </View>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userEmail}>joeldate39@gmail.com</Text>
          </View>

          {isPremium ? (
            <View style={[styles.subCard, styles.subCardPremium]}>
              <View style={styles.subRow}>
                <View style={styles.subIconWrap}>
                  <Ionicons name="diamond" size={26} color={C.coffee} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>PREMIUM ACTIF</Text>
                  </View>
                  <Text style={styles.subTitle}>Accès complet débloqué</Text>
                  <Text style={styles.subSub}>
                    Face Swap · Styles illimités · Export HD
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsPremium(false)}
              >
                <View style={styles.manageBtn}>
                  <Text style={styles.manageBtnText}>Gérer l'abonnement</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.subCard}>
              <View style={styles.subRow}>
                <View style={styles.subIconWrap}>
                  <Ionicons name="diamond-outline" size={26} color={C.soft} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subTitle}>Plan Gratuit</Text>
                  <Text style={styles.subSub}>
                    Premium pour FaceSwap et exports HD
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={() => setIsPremium(true)}
              >
                <Text style={styles.upgradeBtnText}>
                  Passer Premium — 9,99 €/mois
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.sectionLabel}>PARAMETRES</Text>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setLangModal(true)}
          >
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View
                  style={[
                    styles.menuIconWrap,
                    { backgroundColor: "rgba(200,149,106,0.12)" },
                  ]}
                >
                  <Ionicons
                    name="language-outline"
                    size={19}
                    color={C.coffee}
                  />
                </View>
                <Text style={styles.menuLabel}>Langue</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={styles.menuValue}>{langLabel}</Text>
                <Ionicons name="chevron-forward" size={15} color={C.soft} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View
                style={[
                  styles.menuIconWrap,
                  { backgroundColor: "rgba(200,149,106,0.12)" },
                ]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={19}
                  color={C.coffee}
                />
              </View>
              <Text style={styles.menuLabel}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#2D3A50", true: "rgba(200,149,106,0.5)" }}
              thumbColor={notificationsEnabled ? C.coffee : "#4A5875"}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setQualityModal(true)}
          >
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View
                  style={[
                    styles.menuIconWrap,
                    { backgroundColor: "rgba(200,149,106,0.12)" },
                  ]}
                >
                  <Ionicons name="image-outline" size={19} color={C.coffee} />
                </View>
                <View>
                  <Text style={styles.menuLabel}>Qualité des exports</Text>
                  {exportQuality === "ultra" && !isPremium && (
                    <Text style={styles.menuSubLabel}>Requiert Premium</Text>
                  )}
                </View>
              </View>
              <View style={styles.menuRight}>
                <Text style={styles.menuValue}>{qualityLabel}</Text>
                <Ionicons name="chevron-forward" size={15} color={C.soft} />
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>ASSISTANCE</Text>

          {[
            { icon: "help-circle-outline" as const, label: "Centre d'aide" },
            {
              icon: "alert-circle-outline" as const,
              label: "Signaler un problème",
            },
            {
              icon: "shield-checkmark-outline" as const,
              label: "Confidentialité et RGPD",
            },
            { icon: "star-outline" as const, label: "Laisser un avis" },
          ].map((item, i) => (
            <TouchableOpacity key={i} activeOpacity={0.75}>
              <View style={styles.menuItem}>
                <View style={styles.menuLeft}>
                  <View
                    style={[
                      styles.menuIconWrap,
                      { backgroundColor: "rgba(139,135,96,0.12)" },
                    ]}
                  >
                    <Ionicons name={item.icon} size={19} color={C.khaki} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={C.soft} />
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity activeOpacity={0.75} style={{ marginTop: 12 }}>
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View
                  style={[
                    styles.menuIconWrap,
                    { backgroundColor: "rgba(224,85,85,0.12)" },
                  ]}
                >
                  <Ionicons name="log-out-outline" size={19} color="#E05555" />
                </View>
                <Text style={[styles.menuLabel, { color: "#E05555" }]}>
                  Déconnexion
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.version}>dressflow.ai · v1.0.0</Text>
        </SafeAreaView>
      </ScrollView>

      <Modal
        visible={langModal}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLangModal(false)}
        >
          <Pressable style={styles.modalBox} onPress={() => {}}>
            <View style={styles.modalBlur}>
              <Text style={styles.modalTitle}>Langue de l'application</Text>
              {LANGUAGES.map((l) => (
                <TouchableOpacity
                  key={l.key}
                  style={styles.optionRow}
                  onPress={() => {
                    setLanguage(l.key);
                    setLangModal(false);
                  }}
                  activeOpacity={0.75}
                >
                  <View>
                    <Text
                      style={[
                        styles.optionLabel,
                        language === l.key && { color: C.coffee },
                      ]}
                    >
                      {l.label}
                    </Text>
                    <Text style={styles.optionSub}>{l.native}</Text>
                  </View>
                  {language === l.key && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={C.coffee}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={qualityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setQualityModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setQualityModal(false)}
        >
          <Pressable style={styles.modalBox} onPress={() => {}}>
            <View style={styles.modalBlur}>
              <Text style={styles.modalTitle}>Qualité des exports</Text>
              {QUALITIES.map((q) => {
                const locked = q.key === "ultra" && !isPremium;
                return (
                  <TouchableOpacity
                    key={q.key}
                    style={styles.optionRow}
                    onPress={() => {
                      if (!locked) {
                        setExportQuality(q.key);
                        setQualityModal(false);
                      }
                    }}
                    activeOpacity={locked ? 1 : 0.75}
                  >
                    <View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Text
                          style={[
                            styles.optionLabel,
                            exportQuality === q.key && { color: C.coffee },
                            locked && { color: C.soft },
                          ]}
                        >
                          {q.label}
                        </Text>
                        {locked && (
                          <View style={styles.lockedBadge}>
                            <Text style={styles.lockedBadgeText}>Premium</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.optionSub}>{q.desc}</Text>
                    </View>
                    {exportQuality === q.key && !locked ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={C.coffee}
                      />
                    ) : locked ? (
                      <Ionicons
                        name="lock-closed-outline"
                        size={18}
                        color={C.soft}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: 50, paddingTop: 16 },
  profileSection: { alignItems: "center", paddingTop: 56, paddingBottom: 28 },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 36,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.coffee,
    backgroundColor: "rgba(255, 255, 255, 0.09)",
    marginBottom: 14,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: C.cream,
    marginBottom: 4,
  },
  userEmail: { fontSize: 13, color: C.soft },
  subCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 18,
    overflow: "hidden",
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  subCardPremium: {
    borderColor: "rgba(200,149,106,0.25)",
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  subRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 4,
  },
  subIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  premiumBadge: {
    backgroundColor: "rgba(200,149,106,0.15)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "rgba(200,149,106,0.2)",
  },
  premiumBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: C.coffee,
    letterSpacing: 1.2,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.cream,
    marginBottom: 3,
  },
  subSub: { fontSize: 12, color: C.soft, lineHeight: 18 },
  upgradeBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.coffee,
    borderRadius: 25,
    paddingVertical: 13,
    marginTop: 14,
  },
  upgradeBtnText: { color: C.cream, fontWeight: "700", fontSize: 14 },
  manageBtn: {
    alignItems: "center",
    paddingVertical: 11,
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(200,149,106,0.3)",
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  manageBtnText: { color: C.coffee, fontWeight: "600", fontSize: 13 },
  sectionLabel: {
    marginLeft: 16,
    marginTop: 22,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "700",
    color: C.soft,
    letterSpacing: 1.2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 14,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  menuRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 15, color: C.cream, fontWeight: "500" },
  menuSubLabel: { fontSize: 11, color: "#E05555", marginTop: 1 },
  menuValue: { fontSize: 13, color: C.soft },
  version: {
    textAlign: "center",
    color: C.khaki,
    fontSize: 11,
    marginTop: 32,
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.96)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: { width: "85%", borderRadius: 22, overflow: "hidden" },
  modalBlur: {
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderRadius: 22,
    overflow: "hidden",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: C.cream,
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  optionLabel: { fontSize: 15, color: C.cream, fontWeight: "600" },
  optionSub: { fontSize: 12, color: C.soft, marginTop: 2 },
  lockedBadge: {
    backgroundColor: "rgba(200,149,106,0.15)",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  lockedBadgeText: { fontSize: 10, color: C.coffee, fontWeight: "700" },
});
