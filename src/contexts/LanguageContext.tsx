import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "en" | "ur";

type Dict = Record<string, { en: string; ur: string }>;

// Static UI string dictionary. Add keys here as needed.
const DICT: Dict = {
  "nav.home": { en: "Home", ur: "ہوم" },
  "nav.jobs": { en: "Browse Jobs", ur: "نوکریاں دیکھیں" },
  "nav.dashboard": { en: "Dashboard", ur: "ڈیش بورڈ" },
  "nav.admin": { en: "Admin", ur: "ایڈمن" },
  "nav.expert": { en: "Expert", ur: "ماہر" },
  "nav.signin": { en: "Sign In", ur: "سائن ان" },
  "nav.signup": { en: "Get Started", ur: "شروع کریں" },
  "nav.signout": { en: "Sign Out", ur: "سائن آؤٹ" },
  "nav.careers": { en: "Careers", ur: "ہماری ٹیم جوائن کریں" },

  "auth.welcomeBack": { en: "Welcome Back", ur: "خوش آمدید" },
  "auth.createAccount": { en: "Create Your Account", ur: "اپنا اکاؤنٹ بنائیں" },
  "auth.email": { en: "Email Address", ur: "ای میل" },
  "auth.password": { en: "Password", ur: "پاس ورڈ" },
  "auth.forgot": { en: "Forgot password?", ur: "پاس ورڈ بھول گئے؟" },
  "auth.signInGoogle": { en: "Sign in with Google", ur: "گوگل سے سائن ان" },
  "auth.changePassword": { en: "Change Password", ur: "پاس ورڈ تبدیل کریں" },
  "auth.newPassword": { en: "New Password", ur: "نیا پاس ورڈ" },
  "auth.sendResetLink": { en: "Send Reset Link", ur: "ری سیٹ لنک بھیجیں" },
  "auth.update": { en: "Update Password", ur: "پاس ورڈ اپ ڈیٹ" },
  "auth.sessionExpired": { en: "Your session expired. Please refresh.", ur: "آپ کا سیشن ختم ہو گیا، براہ کرم ریفریش کریں۔" },
  "auth.refresh": { en: "Refresh Session", ur: "سیشن ریفریش کریں" },

  "common.loading": { en: "Loading...", ur: "لوڈ ہو رہا ہے..." },
  "common.save": { en: "Save", ur: "محفوظ کریں" },
  "common.cancel": { en: "Cancel", ur: "منسوخ" },
  "common.delete": { en: "Delete", ur: "حذف کریں" },
  "common.edit": { en: "Edit", ur: "ترمیم" },
  "common.add": { en: "Add", ur: "شامل کریں" },
  "common.language": { en: "Language", ur: "زبان" },
};

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, fallback?: string) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("lang") as Lang) || "en";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("lang", l); } catch {}
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
  }, [lang]);

  const t = (key: string, fallback?: string) => {
    const entry = DICT[key];
    if (!entry) return fallback ?? key;
    return entry[lang] || entry.en;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir: lang === "ur" ? "rtl" : "ltr" }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
