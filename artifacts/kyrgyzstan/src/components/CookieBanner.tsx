import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-xl shadow-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Cookie className="h-6 w-6 text-primary shrink-0 mt-0.5 sm:mt-0" />
        <p className="text-sm text-muted-foreground flex-1 leading-relaxed">
          Používáme cookies pro zajištění základní funkčnosti webu a analýzu návštěvnosti.
          Žádné osobní údaje neprodáváme třetím stranám.{" "}
          <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">
            Více informací
          </a>
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={decline}>
            Odmítnout
          </Button>
          <Button size="sm" onClick={accept}>
            Přijmout
          </Button>
        </div>
      </div>
    </div>
  );
}
