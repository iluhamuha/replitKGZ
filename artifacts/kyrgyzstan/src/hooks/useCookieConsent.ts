import { useState, useEffect } from "react";

export type ConsentStatus = "accepted" | "declined" | null;

const STORAGE_KEY = "cookie_consent";

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentStatus>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "accepted" || stored === "declined") return stored;
    return null;
  });

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setConsent("accepted");
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "declined");
    setConsent("declined");
  }

  return { consent, accept, decline };
}
