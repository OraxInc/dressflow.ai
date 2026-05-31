import React, { createContext, useState } from "react";

export type ExportQuality = "standard" | "hd" | "ultra";
export type AppLanguage   = "fr" | "en" | "es";

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
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPremium,             setIsPremium]             = useState(false);
  const [userName,              setUserName]              = useState("Utilisateur");
  const [language,              setLanguage]              = useState<AppLanguage>("fr");
  const [notificationsEnabled,  setNotificationsEnabled]  = useState(true);
  const [exportQuality,         setExportQuality]         = useState<ExportQuality>("hd");

  return (
    <SettingsContext.Provider
      value={{
        isPremium, setIsPremium,
        userName, setUserName,
        language, setLanguage,
        notificationsEnabled, setNotificationsEnabled,
        exportQuality, setExportQuality,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
