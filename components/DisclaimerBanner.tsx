"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "atp-disclaimer-closed-at";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function DisclaimerBanner() {
  const [isVisible, setIsVisible] = useState<boolean | null>(null);

  useEffect(() => {
    const closedAt = localStorage.getItem(STORAGE_KEY);
    if (!closedAt) {
      setIsVisible(true);
      return;
    }
    const elapsed = Date.now() - parseInt(closedAt, 10);
    setIsVisible(elapsed >= ONE_DAY_MS);
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setIsVisible(false);
  };

  if (isVisible === null || !isVisible) return null;

  return (
    <header className="py-4 px-4 border-b border-[#3A3420] bg-[#1A1400]">
      <div className="container mx-auto flex items-center justify-center gap-3">
        <p className="text-xs text-[#948F80]">
          This website was built using AI. Data correctness is not guaranteed.
        </p>
        <button
          onClick={handleClose}
          className="text-[#948F80] hover:text-chartreuse transition-colors p-1"
          aria-label="Close disclaimer"
        >
          ✕
        </button>
      </div>
    </header>
  );
}
