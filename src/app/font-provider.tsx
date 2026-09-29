"use client";

import { useEffect } from "react";

export function FontProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("font-wix-mode");
    document.body.classList.add("font-wix-mode");
  }, []);

  return (
    <div className="font-wix-mode min-h-screen">
      {children}
    </div>
  );
}
