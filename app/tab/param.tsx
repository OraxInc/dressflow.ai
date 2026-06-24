import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useContext, useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    AppLanguage,
    ExportQuality,
    SettingsContext,
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
    themeMode,
    setThemeMode,
    theme,
  } = useContext(SettingsContext);

  const [langModal, setLangModal] = useState(false);
  const [qualityModal, setQualityModal] = useState(false);

  const langLabel =
    LANGUAGES.find((l) => l.key === language)?.label ?? "Français";
  const qualityLabel =
    QUALITIES.find((q) => q.key === exportQuality)?.label ?? "HD";

  return (
    <LinearGradient
      colors={[theme.gradientStart, theme.gradientEnd]}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={38} color={theme.accent} />
            </View>
            <Text style={[styles.userName, { color: theme.text }]}>
              {userName}
            </Text>
            <Text style={[styles.userEmail, { color: theme.textMuted }]}>
              joeldate39@gmail.com
            </Text>
          </View>

          {isPremium ? (
            <View style={[styles.subCard, styles.subCardPremium]}>
              <View style={styles.subRow}>
                <View style={styles.subIconWrap}>
                  <Ionicons name="diamond" size={26} color={"white"} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>PREMIUM ACTIF</Text>
                  </View>
                  <Text style={[styles.subTitle, { color: theme.text }]}>
                    Accès complet débloqué
                  </Text>
                  <Text style={[styles.subSub, { color: theme.textMuted }]}>
                    Face Swap · Styles illimités · Export HD
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsPremium(false)}>
                <View style={styles.manageBtn}>
                  <Text style={[styles.manageBtnText, { color: theme.accent }]}>
                    Gérer l&apos;abonnement
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.subCard}>
              <View style={styles.subRow}>
                <View style={styles.subIconWrap}>
                  <Ionicons name="diamond-outline" size={26} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subTitle, { color: theme.card }]}>
                    Plan Gratuit
                  </Text>
                  <Text style={[styles.subSub, { color: theme.textMuted }]}>
                    Premium pour FaceSwap et exports HD
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={() => setIsPremium(true)}
              >
                <Text style={[styles.upgradeBtnText, { color: "white" }]}>
                  Passer Premium — 9,99 €/mois
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
            PARAMETRES
          </Text>

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
                <Text style={[styles.menuLabel, { color: theme.text }]}>
                  Langue
                </Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={[styles.menuValue, { color: theme.textMuted }]}>
                  {langLabel}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={theme.textMuted}
                />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View
                style={[
                  styles.menuIconWrap,
                  {
                    backgroundColor:
                      themeMode === "dark"
                        ? "rgba(200,149,106,0.12)"
                        : theme.accentSoft,
                  },
                ]}
              >
                <Ionicons
                  name={themeMode === "dark" ? "moon-outline" : "sunny-outline"}
                  size={19}
                  color={themeMode === "dark" ? C.coffee : theme.text}
                />
              </View>
              <View>
                <Text style={[styles.menuLabel, { color: theme.text }]}>
                  Mode thème
                </Text>
                <Text style={[styles.menuSubLabel, { color: theme.textMuted }]}>
                  {" "}
                  {themeMode === "dark" ? "Sombre" : "Clair"}{" "}
                </Text>
              </View>
            </View>
            <Switch
              value={themeMode === "dark"}
              onValueChange={(value) => setThemeMode(value ? "dark" : "light")}
              trackColor={{
                false: theme.accentSoft,
                true: "rgba(200,149,106,0.5)",
              }}
              thumbColor={themeMode === "dark" ? C.coffee : "#4A5875"}
            />
          </View>

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
              <Text style={[styles.menuLabel, { color: theme.text }]}>
                Notifications
              </Text>
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
                  <Ionicons
                    name="image-outline"
                    size={19}
                    color={theme.accent}
                  />
                </View>
                <View>
                  <Text style={[styles.menuLabel, { color: theme.text }]}>
                    Qualité des exports
                  </Text>
                  {exportQuality === "ultra" && !isPremium && (
                    <Text
                      style={[styles.menuSubLabel, { color: theme.textMuted }]}
                    >
                      Requiert Premium
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.menuRight}>
                <Text style={[styles.menuValue, { color: theme.textMuted }]}>
                  {qualityLabel}
                </Text>
                <Ionicons name="chevron-forward" size={15} color={C.soft} />
              </View>
            </View>
          </TouchableOpacity>

          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
            ASSISTANCE
          </Text>

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
                  <Text style={[styles.menuLabel, { color: theme.text }]}>
                    {item.label}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={theme.textMuted}
                />
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

          <Text style={[styles.version, { color: theme.textMuted }]}>
            dressflow.ai · v1.0.0
          </Text>
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
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Langue de l&apos;application
              </Text>
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
                        { color: theme.text },
                        language === l.key && { color: theme.accent },
                      ]}
                    >
                      {l.label}
                    </Text>
                    <Text
                      style={[styles.optionSub, { color: theme.textMuted }]}
                    >
                      {l.native}
                    </Text>
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
              <Text style={[styles.modalTitle, { color: theme.card }]}>
                Qualité des exports
              </Text>
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
                            { color: theme.text },
                            exportQuality === q.key && { color: theme.accent },
                            locked && { color: theme.textMuted },
                          ]}
                        >
                          {q.label}
                        </Text>
                        {locked && (
                          <View style={styles.lockedBadge}>
                            <Text
                              style={[
                                styles.lockedBadgeText,
                                { color: theme.accent },
                              ]}
                            >
                              Premium
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={[styles.optionSub, { color: theme.textMuted }]}
                      >
                        {q.desc}
                      </Text>
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
    backgroundColor: "rgba(90, 57, 18, 0.12)",
    marginBottom: 14,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  userEmail: { fontSize: 13 },
  subCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 30,
    overflow: "hidden",
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(2, 12, 33, 0.75)",
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
    color: C.border,
    letterSpacing: 1.2,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 3,
  },
  subSub: { fontSize: 12, lineHeight: 18 },
  upgradeBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.coffee,
    borderRadius: 25,
    paddingVertical: 13,
    marginTop: 14,
  },
  upgradeBtnText: { fontWeight: "700", fontSize: 14 },
  manageBtn: {
    alignItems: "center",
    paddingVertical: 11,
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(200,149,106,0.3)",
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  manageBtnText: { fontWeight: "600", fontSize: 13 },
  sectionLabel: {
    marginLeft: 16,
    marginTop: 22,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "700",
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
  menuLabel: { fontSize: 15, fontWeight: "500" },
  menuSubLabel: { fontSize: 11, color: "#E05555", marginTop: 1 },
  menuValue: { fontSize: 13 },
  version: {
    textAlign: "center",
    fontSize: 11,
    marginTop: 32,
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: { width: "85%", borderRadius: 22, overflow: "hidden" },
  modalBlur: {
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(11, 23, 40, 0.95)",
    borderRadius: 22,
    overflow: "hidden",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
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
  optionLabel: { fontSize: 15, fontWeight: "600" },
  optionSub: { fontSize: 12, marginTop: 2 },
  lockedBadge: {
    backgroundColor: "rgba(171, 104, 49, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  lockedBadgeText: { fontSize: 10, fontWeight: "700" },
});
