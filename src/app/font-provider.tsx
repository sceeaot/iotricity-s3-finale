"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const EXCLUDED_PATHS = ["/", "/login", "/admin/login"];

export function FontProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const normalizedPath = pathname ? pathname.replace(/\/$/, "") || "/" : "/";
  const isExcluded = EXCLUDED_PATHS.includes(normalizedPath);

  useEffect(() => {
    if (isExcluded) {
      document.documentElement.classList.remove("font-wix-mode");
      document.body.classList.remove("font-wix-mode");
    } else {
      document.documentElement.classList.add("font-wix-mode");
      document.body.classList.add("font-wix-mode");
    }
  }, [isExcluded]);

  return (
    <div className={isExcluded ? "font-original-mode" : "font-wix-mode min-h-screen"}>
      {children}
    </div>
  );
}
