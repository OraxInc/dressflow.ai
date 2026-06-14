import React, { createContext, useState } from "react";

export type ExportQuality = "standard" | "hd" | "ultra";
export type AppLanguage = "fr" | "en" | "es";
export type ThemeMode = "light" | "dark";

export const themes = {
  light: {
    mode: "light" as const,
    background: "#FFFFFF",
    screen: "#F5F7FF",
    card: "#FFFFFF",
    border: "rgba(12, 18, 48, 0.12)",
    text: "#0C0548",
    textMuted: "#5F718B",
    accent: "#ffffff",
    accentSoft: "rgba(43, 79, 197, 0.18)",
    surface: "#FFFFFF",
    statusBarStyle: "dark" as const,
    gradientStart: "#F5F7FF",
    gradientEnd: "#FFFFFF",
  },
  dark: {
    mode: "dark" as const,
    background: "#0B1728",
    screen: "#061428",
    card: "rgba(255,255,255,0.09)",
    border: "rgba(255,255,255,0.11)",
    text: "#F0EBE3",
    textMuted: "#8B8F9E",
    accent: "#C8956A",
    accentSoft: "rgba(200, 149, 106, 0.14)",
    surface: "rgba(255,255,255,0.09)",
    statusBarStyle: "light" as const,
    gradientStart: "#0C1C34EB",
    gradientEnd: "#061428EB",
  },
};

type AppContextType = {
  isPremium: boolean;
  setIsPremium: (v: boolean) => void;
  userName: string;
  setUserName: (v: string) => void;
  language: AppLanguage;
  setLanguage: (v: AppLanguage) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
  exportQuality: ExportQuality;
  setExportQuality: (v: ExportQuality) => void;
  themeMode: ThemeMode;
  setThemeMode: (v: ThemeMode) => void;
  theme: typeof themes.light | typeof themes.dark;
};

export const SettingsContext = createContext<AppContextType>({
  isPremium: false,
  setIsPremium: () => {},
  userName: "Utilisateur",
  setUserName: () => {},
  language: "fr",
  setLanguage: () => {},
  notificationsEnabled: true,
  setNotificationsEnabled: () => {},
  exportQuality: "hd",
  setExportQuality: () => {},
  themeMode: "light",
  setThemeMode: () => {},
  theme: themes.light,
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [userName, setUserName] = useState("Utilisateur");
  const [language, setLanguage] = useState<AppLanguage>("fr");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [exportQuality, setExportQuality] = useState<ExportQuality>("hd");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  const theme = themes[themeMode];

  return (
    <SettingsContext.Provider
      value={{
        isPremium,
        setIsPremium,
        userName,
        setUserName,
        language,
        setLanguage,
        notificationsEnabled,
        setNotificationsEnabled,
        exportQuality,
        setExportQuality,
        themeMode,
        setThemeMode,
        theme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
