"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Purchase = {
  receiptId: string;
  teamName: string;
  cyberpunkName: string;
  componentName: string;
  pricePaid: number;
  purchasedAt: string;
  dispatched: boolean;
};

export default function Receipt() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<Purchase | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/shop/receipt/${id}`)
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setP(d.purchase)));
  }, [id]);

  if (error)
    return (
      <main className="py-[42px] pb-[70px] max-[760px]:pt-[28px] w-[min(1180px,calc(100%-40px))] max-[760px]:w-[min(calc(100%-28px),620px)] mx-auto">
        <p className="text-orange">{error}</p>
      </main>
    );

  if (!p)
    return (
      <main className="py-[42px] pb-[70px] max-[760px]:pt-[28px] w-[min(1180px,calc(100%-40px))] max-[760px]:w-[min(calc(100%-28px),620px)] mx-auto">
        <p className="text-muted">LOADING RECEIPT...</p>
      </main>
    );

  return (
    <main className="py-[42px] pb-[70px] max-[760px]:pt-[28px] w-[min(1180px,calc(100%-40px))] max-[760px]:w-[min(calc(100%-28px),620px)] mx-auto max-w-[620px]">
      <div className="border border-line bg-[#101313]/78 p-8 print:border-[#aaa]">
        <p className="text-acid text-[11px] tracking-[.16em] uppercase">EE STUDENTS CHAPTER / COMPONENT DISPATCH</p>
        <h1 className="text-[34px] mt-[18px] mb-[28px] font-bold">
          Receipt <span className="text-acid">#{p.receiptId}</span>
        </h1>
        {[
          ["TEAM", p.teamName],
          ["MODULE", p.cyberpunkName],
          ["BASE COMPONENT", p.componentName],
          ["PRICE PAID", `${p.pricePaid} BC`],
          ["PURCHASED", new Date(p.purchasedAt).toLocaleString()],
          ["STATUS", p.dispatched ? "DISPATCHED" : "PENDING DISPATCH"],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-[15px] border-t border-line py-[14px] text-xs">
            <span className="text-muted">{label}</span>
            <span className={label === "STATUS" ? "text-acid text-[11px] uppercase font-bold" : ""}>{value}</span>
          </div>
        ))}
        <p className="text-muted leading-[1.6] mt-6">
          Show this receipt at the component dispatch desk. The receipt ID must match before release.
        </p>
      </div>
      <div className="print:hidden flex gap-3 mt-[18px]">
        <a className="border border-line bg-transparent text-paper px-4 py-3 font-bold no-underline inline-block hover:bg-white/10 transition" href="/shop">
          BACK TO SHOP
        </a>
        <button
          className="border border-acid bg-acid text-ink px-4 py-3 font-bold no-underline inline-block hover:bg-[#efffa8] cursor-pointer transition"
          onClick={() => window.print()}
        >
          PRINT
        </button>
      </div>
    </main>
  );
}