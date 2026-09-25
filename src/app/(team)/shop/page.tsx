"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Item = {
  _id: string;
  name: string;
  cyberpunkName: string;
  price: number;
  description: string;
  purchased: boolean;
  receiptId?: string;
};

export default function Shop() {
  const [items, setItems] = useState<Item[]>([]);
  const [coins, setCoins] = useState(0);
  const [busy, setBusy] = useState("");
  const router = useRouter();

  async function load() {
    const r = await fetch("/api/shop/components");
    if (r.status === 401) {
      router.push("/login");
      return;
    }
    const d = await r.json();
    setItems(d.components || []);
    setCoins(d.teamCoins || 0);
  }

  useEffect(() => {
    load();
  }, []);

  async function buy(id: string, name: string, price: number) {
    if (!window.confirm(`Redeem ${name} for ${price} BC?`)) return;
    setBusy(id);
    const r = await fetch("/api/shop/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ componentId: id }),
    });
    const d = await r.json();
    setBusy("");
    if (!r.ok) {
      window.alert(d.error);
      return;
    }
    router.push(`/receipt/${d.receiptId}`);
  }

  return (
    <>
      <header className="border-b border-line py-[22px] max-[760px]:py-4 w-full print:hidden">
        <div className="w-[min(1180px,calc(100%-40px))] max-[760px]:w-[min(calc(100%-28px),620px)] mx-auto flex flex-row items-center justify-between gap-5 max-[760px]:gap-3">
          <a className="font-bold tracking-[.08em] no-underline" href="/">
            IOTRICITY <span className="text-acid">// SHOP</span>
          </a>
          <nav className="flex flex-row items-center gap-5 max-[760px]:gap-2.5 text-muted text-xs">
            <a href="/dashboard" className="hover:text-paper transition">
              Console
            </a>
            <a href="/leaderboard" className="hover:text-paper transition">
              Rankings
            </a>
          </nav>
        </div>
      </header>
      <main className="py-[42px] pb-[70px] max-[760px]:pt-[28px] w-[min(1180px,calc(100%-40px))] max-[760px]:w-[min(calc(100%-28px),620px)] mx-auto">
        <div className="flex justify-between items-end mb-[30px]">
          <div>
            <p className="text-acid text-[11px] tracking-[.16em] uppercase">HARDWARE EXCHANGE</p>
            <h1 className="text-[42px] mt-[12px] mb-0 font-bold">Component shop</h1>
          </div>
          <div className="border-t-2 border-acid pt-[12px]">
            <span className="text-muted text-xs block">BALANCE</span>
            <strong className="block text-[30px] mt-[7px] font-bold">{coins} BC</strong>
          </div>
        </div>
        <p className="text-muted mb-[26px]">Redeem one of each module. Bring the generated receipt to dispatch.</p>
        <div className="grid gap-4">
          {items.map((i) => (
            <div
              className="border border-line bg-[#101313]/78 p-6 flex justify-between gap-[20px] items-center print:border-[#aaa]"
              key={i._id}
            >
              <div>
                <p className="text-acid text-[11px] tracking-[.16em] uppercase">{i.name}</p>
                <h2 className="mt-[10px] mb-[5px] text-[21px] font-bold">{i.cyberpunkName}</h2>
                <p className="text-muted">{i.description || "Field-ready component module."}</p>
              </div>
              <div className="text-right min-w-[115px]">
                <p className="text-[18px] mt-0 mb-[12px] font-bold">{i.price} BC</p>
                {i.purchased ? (
                  <a className="text-acid text-[11px] uppercase hover:underline" href={`/receipt/${i.receiptId}`}>
                    RECEIPT -&gt;
                  </a>
                ) : (
                  <button
                    className="border border-acid bg-acid text-ink px-4 py-3 font-bold no-underline inline-block hover:bg-[#efffa8] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer transition"
                    disabled={!!busy || coins < i.price}
                    onClick={() => buy(i._id, i.cyberpunkName, i.price)}
                  >
                    {busy === i._id ? "..." : "REDEEM"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}