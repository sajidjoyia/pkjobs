import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const LanguageToggle = () => {
  const { lang, setLang } = useLanguage();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLang(lang === "en" ? "ur" : "en")}
      className="gap-1.5"
      title={lang === "en" ? "اردو میں دیکھیں" : "View in English"}
    >
      <Languages className="h-4 w-4" />
      <span className="font-semibold">{lang === "en" ? "اردو" : "EN"}</span>
    </Button>
  );
};

export default LanguageToggle;
