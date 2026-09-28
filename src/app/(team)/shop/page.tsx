"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import componentsData from "@/data/components.json";

type Item = {
  _id: string;
  name: string;
  cyberpunkName: string;
  price: number;
  description: string;
  category?: string;
  imageUrl?: string;
  purchased: boolean;
  receiptId?: string;
};

type JsonComponent = {
  id: string;
  name: string;
  cyberpunkName: string;
  quantity?: number;
  category?: string;
  price?: number;
  description?: string;
  imageUrl: string;
  productUrl?: string;
};

const typedComponentsData = componentsData as JsonComponent[];

function CornerMarks({ size = 9 }: { size?: number }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[1px] -top-[1px] border-l-2 border-t-2 border-white/80"
        style={{ width: size, height: size }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-[1px] -top-[1px] border-r-2 border-t-2 border-white/80"
        style={{ width: size, height: size }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[1px] -left-[1px] border-b-2 border-l-2 border-white/80"
        style={{ width: size, height: size }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[1px] -right-[1px] border-b-2 border-r-2 border-white/80"
        style={{ width: size, height: size }}
      />
    </>
  );
}

function resolveComponentMeta(item: Item): { imageUrl: string; category: string } {
  // If item already has a valid imageUrl from DB, use it
  if (item.imageUrl && item.imageUrl.trim().length > 0) {
    return {
      imageUrl: item.imageUrl,
      category: item.category || "Module",
    };
  }

  const nameLower = (item.name || "").toLowerCase();

  // Match by actual name or id in components.json
  const match = typedComponentsData.find(
    (c) =>
      c.name.toLowerCase() === nameLower ||
      c.id.toLowerCase() === nameLower ||
      nameLower.includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(nameLower) ||
      nameLower.includes(c.id.toLowerCase())
  );
  if (match) {
    return {
      imageUrl: match.imageUrl,
      category: match.category || "Module",
    };
  }

  return {
    imageUrl: typedComponentsData[0]?.imageUrl || "",
    category: item.category || "Module",
  };
}

export default function Shop() {
  const [items, setItems] = useState<Item[]>([]);
  const [coins, setCoins] = useState(0);
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  async function load() {
    try {
      const r = await fetch("/api/shop/components");
      if (r.status === 401) {
        router.push("/login");
        return;
      }
      const d = await r.json();
      setItems(d.components || []);
      setCoins(d.teamCoins || 0);
    } catch (e) {
      console.error("Failed to load components:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function buy(id: string, name: string, price: number) {
    if (!window.confirm(`Redeem ${name} for ${price} BC?`)) return;
    setBusy(id);
    try {
      const r = await fetch("/api/shop/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentId: id }),
      });
      const d = await r.json();
      setBusy("");
      if (!r.ok) {
        window.alert(d.error || "Purchase failed");
        return;
      }
      router.push(`/receipt/${d.receiptId}`);
    } catch (e) {
      setBusy("");
      window.alert("An unexpected error occurred during purchase.");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const itemsWithMeta = useMemo(() => {
    return items.map((item) => {
      const meta = resolveComponentMeta(item);
      return {
        ...item,
        resolvedImage: meta.imageUrl,
        resolvedCategory: meta.category,
      };
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return itemsWithMeta;
    return itemsWithMeta.filter((i) => {
      return (
        i.name.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.resolvedCategory.toLowerCase().includes(q)
      );
    });
  }, [itemsWithMeta, search]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030713] text-white">
        <div className="relative border border-white/20 bg-black/20 p-8 backdrop-blur-sm">
          <CornerMarks />
          <p className="font-sans text-xs tracking-[0.16em] uppercase text-white/50">
            SYNCING COMPONENT CATALOG...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="relative isolate min-h-screen bg-[#030713] text-white">
      {/* Background Image & Overlay matching Dashboard */}
      <Image
        src="/bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-center fixed opacity-40 pointer-events-none"
      />
      <div aria-hidden="true" className="fixed inset-0 -z-10 bg-[#020611]/75 pointer-events-none" />

      {/* Header */}
      <header className="w-full border-b border-white/10 px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between">
          <a href="/dashboard" className="transition hover:opacity-85">
            <Image
              src="/dashboard_logo.png"
              alt="SCEE x IOTRICITY"
              width={160}
              height={28}
              className="h-6 sm:h-7 w-auto object-contain"
              priority
            />
          </a>
          <div className="flex items-center gap-3">
            <a
              href="/dashboard"
              className="flex items-center justify-center border border-white/20 bg-white px-4 py-2.5 text-xs font-semibold tracking-wider text-black transition hover:bg-white/90 hover:text-black"
            >
              CONSOLE
            </a>
            <button
              type="button"
              onClick={logout}
              aria-label="Disconnect"
              title="Disconnect"
              className="relative flex h-[38px] w-[38px] items-center justify-center border border-white/25 bg-black/15 text-white transition hover:bg-white/10 active:scale-95"
            >
              <CornerMarks size={6} />
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1320px] px-6 py-8 sm:px-10 pb-20 animate-rise">
        {/* Title & Credits Balance Row */}
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[12px] font-sans tracking-[0.16em] uppercase text-white/40">
              HARDWARE EXCHANGE
            </p>
            <h1 className="mt-1 font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
              Component Shop
            </h1>
            <p className="mt-2.5 font-sans text-sm sm:text-base font-light text-white/50">
              Redeem one of each module. Bring the generated receipt to dispatch.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-end">
            <Image
              src="/currency.png"
              alt="BC"
              width={44}
              height={44}
              className="h-9 w-9 sm:h-11 sm:w-11 object-contain drop-shadow-[0_0_16px_rgba(59,130,246,0.6)]"
            />
            <span className="font-sans text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
              {coins}
            </span>
          </div>
        </div>

        {/* Search Bar & Module Counter */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-white/40">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search components..."
              className="h-[46px] w-full border border-white/10 bg-[#080d19]/80 pl-11 pr-4 font-sans text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none transition backdrop-blur-sm"
            />
          </div>
          <div className="text-left sm:text-right font-sans text-xs sm:text-sm font-semibold tracking-[0.14em] uppercase text-white/50">
            {filteredItems.length} / {items.length} MODULES
          </div>
        </div>

        {/* Components Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredItems.length === 0 ? (
            <div className="relative border border-white/20 bg-black/20 p-8 backdrop-blur-sm text-center col-span-full py-16">
              <CornerMarks />
              <p className="font-sans text-xs tracking-[0.16em] uppercase text-white/40">
                NO MATCHING MODULES FOUND
              </p>
              <p className="mt-2 text-sm text-white/50">
                No components matched your search &quot;{search}&quot;.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const notEnoughCredits = coins < item.price;

              return (
                <div
                  key={item._id}
                  className="relative border border-white/20 bg-black/20 backdrop-blur-sm flex flex-col justify-between transition-all duration-200 hover:border-white/40 group"
                >
                  <CornerMarks size={8} />

                  {/* Component Image */}
                  <div className="relative w-full aspect-[4/3] bg-[#f3f4f6] border-b border-white/10 overflow-hidden flex items-center justify-center p-3">
                    {item.resolvedImage ? (
                      <img
                        src={item.resolvedImage}
                        alt={item.name}
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallbackUrl = typedComponentsData[0]?.imageUrl;
                          if (target.src !== fallbackUrl) {
                            target.src = fallbackUrl;
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-neutral-400">
                        <svg
                          width="36"
                          height="36"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Component Details */}
                  <div className="p-5 flex flex-col flex-1 justify-between gap-5">
                    <div>
                      <p className="text-[11px] font-sans font-semibold tracking-[0.16em] uppercase text-white/45">
                        {item.resolvedCategory.toUpperCase()}
                      </p>
                      <h2 className="mt-1 font-sans text-lg font-semibold tracking-tight text-white line-clamp-1">
                        {item.name}
                      </h2>
                      <p className="mt-2 font-sans text-xs font-light leading-relaxed text-white/50 line-clamp-2 min-h-[34px]">
                        {item.description || "Field-ready component module."}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      {/* Price Row */}
                      <div className="flex items-center gap-2">
                        <Image
                          src="/currency.png"
                          alt="BC"
                          width={20}
                          height={20}
                          className="h-5 w-5 object-contain"
                        />
                        <span className="font-sans text-lg font-bold tracking-tight text-white">
                          {item.price}
                        </span>
                      </div>

                      {/* Action Button */}
                      {item.purchased ? (
                        <a
                          href={`/receipt/${item.receiptId}`}
                          className="h-[44px] w-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition hover:bg-emerald-500/20 active:scale-[0.99]"
                        >
                          <span>RECEIPT</span>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                          </svg>
                        </a>
                      ) : notEnoughCredits ? (
                        <button
                          type="button"
                          disabled
                          className="h-[44px] w-full bg-[#181d29]/90 border border-white/10 text-white/35 font-bold text-xs tracking-wider uppercase cursor-not-allowed select-none flex items-center justify-center"
                        >
                          NOT ENOUGH CREDITS
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy === item._id}
                          onClick={() => buy(item._id, item.name, item.price)}
                          className="h-[44px] w-full bg-white text-[#080d19] font-bold text-xs tracking-wider uppercase transition hover:bg-white/85 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                        >
                          {busy === item._id ? "PURCHASING..." : "PURCHASE"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}