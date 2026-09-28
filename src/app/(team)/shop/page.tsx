"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import componentsData from "@/data/components.json";

type Item = {
  _id: string;
  name: string;
  cyberpunkName?: string;
  price: number;
  description: string;
  category?: string;
  imageUrl?: string;
  purchased: boolean;
  receiptId?: string;
  isProjectComponent?: boolean;
  requiredRole?: string;
};

type ItemWithMeta = Item & {
  resolvedImage: string;
  resolvedCategory: string;
};

type JsonComponent = {
  id: string;
  name: string;
  cyberpunkName?: string;
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
  if (item.imageUrl && item.imageUrl.trim().length > 0) {
    return {
      imageUrl: item.imageUrl,
      category: item.category || "Module",
    };
  }

  const nameLower = (item.name || "").toLowerCase();

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
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"project" | "all">("project");
  const [teamCode, setTeamCode] = useState<string>("");
  const [teamProject, setTeamProject] = useState<{ pathId: string; projectName: string } | null>(null);

  // Cart State
  const [cartIds, setCartIds] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const router = useRouter();

  // Load cart from localStorage once on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("iotricity_cart_items");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCartIds(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load cart from storage:", e);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("iotricity_cart_items", JSON.stringify(cartIds));
    } catch (e) {
      console.error("Failed to persist cart:", e);
    }
  }, [cartIds]);

  async function load() {
    try {
      const r = await fetch("/api/shop/components");
      if (r.status === 401) {
        router.push("/login");
        return;
      }
      const d = await r.json();
      const loadedItems: Item[] = d.components || [];
      setItems(loadedItems);
      setCoins(d.teamCoins || 0);
      if (d.teamCode) setTeamCode(d.teamCode);
      if (d.teamProject) setTeamProject(d.teamProject);

      // Auto prune cart: Remove any items that are already purchased
      setCartIds((prev) =>
        prev.filter((id) => {
          const item = loadedItems.find((i) => i._id === id);
          return item && !item.purchased;
        })
      );
    } catch (e) {
      console.error("Failed to load components:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const itemsWithMeta = useMemo<ItemWithMeta[]>(() => {
    return items.map((item) => {
      const meta = resolveComponentMeta(item);
      return {
        ...item,
        resolvedImage: meta.imageUrl,
        resolvedCategory: meta.category,
      };
    });
  }, [items]);

  const displayedItems = useMemo(() => {
    const baseList =
      activeTab === "project"
        ? itemsWithMeta.filter((i) => i.isProjectComponent)
        : itemsWithMeta;

    const q = search.trim().toLowerCase();
    if (!q) return baseList;
    return baseList.filter((i) => {
      return (
        i.name.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.resolvedCategory.toLowerCase().includes(q)
      );
    });
  }, [itemsWithMeta, activeTab, search]);

  const projectComponentsCount = useMemo(() => {
    return items.filter((i) => i.isProjectComponent).length;
  }, [items]);

  // Cart Items derived from itemsWithMeta
  const cartItems = useMemo(() => {
    return cartIds
      .map((id) => itemsWithMeta.find((i) => i._id === id))
      .filter((i): i is ItemWithMeta => !!i && !i.purchased);
  }, [cartIds, itemsWithMeta]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price, 0);
  }, [cartItems]);

  const notEnoughCartCredits = coins < cartTotal;

  function toggleCartItem(item: ItemWithMeta) {
    if (item.purchased) return;
    if (item.isProjectComponent === false) {
      window.alert("This component is restricted to another team's project build.");
      return;
    }
    setCartIds((prev) => {
      if (prev.includes(item._id)) {
        return prev.filter((id) => id !== item._id);
      } else {
        return [...prev, item._id];
      }
    });
  }

  function removeFromCart(id: string) {
    setCartIds((prev) => prev.filter((item) => item !== id));
  }

  function clearCart() {
    setCartIds([]);
  }

  // Single Item Direct Buy
  async function buySingle(item: ItemWithMeta) {
    if (coins < item.price) {
      window.alert(`Insufficient credits. You need ${item.price} BC to purchase ${item.name}.`);
      return;
    }
    if (!window.confirm(`Confirm purchase:\n${item.name}\nCost: ${item.price} BC`)) return;

    setBusy(item._id);
    try {
      const r = await fetch("/api/shop/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentId: item._id }),
      });
      const d = await r.json();
      setBusy("");
      if (!r.ok) {
        window.alert(d.error || "Purchase failed.");
        return;
      }
      // Remove from cart if present
      removeFromCart(item._id);
      router.push(`/receipt/${d.receiptId}`);
    } catch (e) {
      setBusy("");
      window.alert("An unexpected network error occurred.");
    }
  }

  // Multi-item Cart Checkout
  async function checkoutCart() {
    if (cartItems.length === 0) return;

    if (coins < cartTotal) {
      window.alert(
        `Insufficient balance. Total required: ${cartTotal} BC, but you have ${coins} BC.`
      );
      return;
    }

    const itemNames = cartItems.map((i) => `• ${i.name} (${i.price} BC)`).join("\n");
    if (
      !window.confirm(
        `Confirm purchase of ${cartItems.length} components:\n\n${itemNames}\n\nTotal Price: ${cartTotal} BC`
      )
    ) {
      return;
    }

    setIsCheckingOut(true);
    try {
      const r = await fetch("/api/shop/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentIds: cartItems.map((i) => i._id) }),
      });
      const d = await r.json();
      setIsCheckingOut(false);
      if (!r.ok) {
        window.alert(d.error || "Checkout failed.");
        return;
      }
      // Clear cart on success
      clearCart();
      setIsCartOpen(false);
      router.push(`/receipt/${d.receiptId}`);
    } catch (e) {
      setIsCheckingOut(false);
      window.alert("An error occurred during checkout.");
    }
  }

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
      {/* Background Graphic */}
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
      <header className="w-full border-b border-white/10 px-6 py-5 sm:px-10 sticky top-0 z-30 bg-[#030713]/85 backdrop-blur-md">
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
              className="flex h-[38px] items-center justify-center border border-white/20 bg-white px-4 text-xs font-semibold tracking-wider text-black transition hover:bg-white/90 hover:text-black"
            >
              CONSOLE
            </a>
            {/* Cart Header Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex h-[38px] items-center gap-2 border border-white/25 px-3.5 text-xs font-semibold tracking-wider text-emerald-300 hover:bg-emerald-500/20 hover:text-white transition cursor-pointer"
              title="Open Hardware Cart"
            >
              <CornerMarks size={6} />
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              <span className="text-white">CART</span>
              {cartItems.length > 0 && (
                <span className="relative flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1.5 text-[10px] font-bold text-black">
                  {cartItems.length}
                </span>
              )}
            </button>



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
      <main className="mx-auto max-w-[1320px] px-6 py-8 sm:px-10 pb-28 animate-rise">
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
              Add hardware modules to your cart and redeem them together for your build.
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

        {/* Project Navigation Tabs */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("project")}
              className={`relative px-4 py-2.5 font-sans text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2 cursor-pointer ${activeTab === "project"
                  ? "bg-white text-black border border-white"
                  : "bg-black/25 text-white/60 border border-white/10 hover:border-white/30 hover:text-white"
                }`}
            >
              <CornerMarks size={6} />
              <span>PROJECT REQUIRED</span>
              <span
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${activeTab === "project"
                    ? "bg-black text-white"
                    : "bg-white/10 text-white/70"
                  }`}
              >
                {projectComponentsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`relative px-4 py-2.5 font-sans text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2 cursor-pointer ${activeTab === "all"
                  ? "bg-white text-black border border-white"
                  : "bg-black/25 text-white/60 border border-white/10 hover:border-white/30 hover:text-white"
                }`}
            >
              <CornerMarks size={6} />
              <span>ALL CATALOG</span>
              <span
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${activeTab === "all"
                    ? "bg-black text-white"
                    : "bg-white/10 text-white/70"
                  }`}
              >
                {items.length}
              </span>
            </button>
          </div>
        </div>

        {/* Search Bar & Module Counter */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              placeholder="Search components by name or category..."
              className="h-[46px] w-full border border-white/10 bg-[#080d19]/80 pl-11 pr-4 font-sans text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none transition backdrop-blur-sm"
            />
          </div>
          <div className="text-left sm:text-right font-sans text-xs sm:text-sm font-semibold tracking-[0.14em] uppercase text-white/50">
            {displayedItems.length} / {items.length} MODULES
          </div>
        </div>

        {/* Components Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {displayedItems.length === 0 ? (
            <div className="relative border border-white/20 bg-black/20 p-8 backdrop-blur-sm text-center col-span-full py-16">
              <CornerMarks />
              <p className="font-sans text-xs tracking-[0.16em] uppercase text-white/40">
                NO MATCHING MODULES FOUND
              </p>
              <p className="mt-2 text-sm text-white/50">
                {search
                  ? `No components matched your search "${search}".`
                  : activeTab === "project"
                    ? "No assigned project components found. Switch to All Catalog to view full inventory."
                    : "No components available in catalog."}
              </p>
            </div>
          ) : (
            displayedItems.map((item) => {
              const notEnoughCredits = coins < item.price;
              const isRestricted = item.isProjectComponent === false;
              const inCart = cartIds.includes(item._id);

              return (
                <div
                  key={item._id}
                  className={`relative border backdrop-blur-sm flex flex-col justify-between transition-all duration-200 group ${inCart
                      ? "border-emerald-500/60 bg-emerald-950/15 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                      : isRestricted
                        ? "border-white/10 bg-black/35 opacity-75 hover:border-white/20"
                        : "border-white/20 bg-black/20 hover:border-white/40"
                    }`}
                >
                  <CornerMarks size={8} />

                  {/* Component Image */}
                  <div className="relative w-full aspect-[4/3] bg-[#f3f4f6] border-b border-white/10 overflow-hidden flex items-center justify-center p-3">
                    {item.resolvedImage ? (
                      <img
                        src={item.resolvedImage}
                        alt={item.name}
                        className={`w-full h-full object-contain transition-transform duration-300 ${isRestricted
                            ? "grayscale-[40%] group-hover:scale-100"
                            : "group-hover:scale-105"
                          }`}
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

                    {inCart && (
                      <div className="absolute top-2.5 left-2.5 bg-emerald-500 text-black font-mono text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 shadow-md flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>IN CART</span>
                      </div>
                    )}
                  </div>

                  {/* Component Details */}
                  <div className="p-5 flex flex-col flex-1 justify-between gap-5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-mono font-semibold tracking-[0.16em] uppercase text-white/50">
                          {item.resolvedCategory.toUpperCase()}
                        </p>

                      </div>

                      {/* Actual Component Name (No cyberpunk name) */}
                      <h2 className="mt-2 font-sans text-lg font-semibold tracking-tight text-white line-clamp-2 min-h-[48px]">
                        {item.name}
                      </h2>

                      <p className="mt-2 font-sans text-xs font-light leading-relaxed text-white/50 line-clamp-2 min-h-[34px]">
                        {item.description || "Field-ready component module."}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      {/* Price Row */}
                      <div className="flex items-center justify-between">
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
                      </div>

                      {/* Action Buttons */}
                      {item.purchased ? (
                        <a
                          href={`/receipt/${item.receiptId}`}
                          className="h-[44px] w-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition hover:bg-emerald-500/20 active:scale-[0.99]"
                        >
                          <span>VIEW RECEIPT</span>
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
                      ) : isRestricted ? (
                        <button
                          type="button"
                          disabled
                          className="h-[44px] w-full bg-red-950/25 border border-red-500/30 text-red-400/70 font-bold text-[11px] tracking-wider uppercase cursor-not-allowed select-none flex items-center justify-center gap-2"
                          title="Anti-cheat lock: This module is reserved for another team's project."
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          <span>RESTRICTED // OTHER PROJECT</span>
                        </button>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {/* Add to Cart Toggle */}
                          <button
                            type="button"
                            onClick={() => toggleCartItem(item)}
                            className={`h-[44px] px-3 font-bold text-xs tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-1.5 border ${inCart
                                ? "bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400"
                                : "bg-black/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/15"
                              }`}
                          >
                            {inCart ? (
                              <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>IN CART</span>
                              </>
                            ) : (
                              <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <line x1="12" y1="5" x2="12" y2="19" />
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                <span>ADD CART</span>
                              </>
                            )}
                          </button>

                          {/* Direct Buy Button */}
                          <button
                            type="button"
                            disabled={busy === item._id || notEnoughCredits}
                            onClick={() => buySingle(item)}
                            className="h-[44px] px-3 bg-white text-[#080d19] font-bold text-xs tracking-wider uppercase transition hover:bg-white/85 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center truncate"
                            title={notEnoughCredits ? "Not enough credits" : "Buy this item immediately"}
                          >
                            {busy === item._id
                              ? "BUYING..."
                              : notEnoughCredits
                                ? "NO COINS"
                                : "BUY NOW"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Floating Bottom Cart Bar (Appears when items are in cart) */}
      {cartItems.length > 0 && !isCartOpen && (
        <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 max-w-xl w-full">
          <div className="relative border border-emerald-500/60 bg-[#06101c]/95 p-3.5 sm:px-6 sm:py-4 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex items-center justify-between gap-4">
            <CornerMarks size={7} />

            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[9px] font-bold text-black">
                  {cartItems.length}
                </span>
              </div>

              <div className="min-w-0">
                <p className="font-sans text-xs sm:text-sm font-semibold text-white truncate">
                  {cartItems.length} {cartItems.length === 1 ? "component" : "components"} selected
                </p>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                  <span>Total:</span>
                  <span className="font-bold">{cartTotal} BC</span>
                  {notEnoughCartCredits && (
                    <span className="text-[10px] text-red-400 font-sans ml-1">
                      (Need {cartTotal - coins} more)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="h-10 px-4 bg-emerald-400 text-black font-sans text-xs font-bold uppercase tracking-wider hover:bg-emerald-300 transition cursor-pointer flex items-center gap-1.5"
              >
                <span>VIEW CART</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Slide-out Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-md border-l border-white/20 bg-[#060b16] p-6 shadow-2xl flex flex-col justify-between text-white animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full border border-emerald-400/50 bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="8" cy="21" r="1" />
                        <circle cx="19" cy="21" r="1" />
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="font-sans text-lg font-bold tracking-tight text-white">
                        Hardware Cart
                      </h2>
                      <p className="text-[11px] font-mono uppercase text-white/40">
                        {cartItems.length} {cartItems.length === 1 ? "Module" : "Modules"} Ready
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    aria-label="Close cart"
                    className="p-1.5 text-white/50 hover:text-white transition cursor-pointer"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Balance Status Banner */}
                <div className="mt-4 p-3.5 border border-white/10 bg-white/5 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-white/70">
                    <span>TEAM BALANCE:</span>
                    <span className="font-bold text-white">{coins} BC</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>CART TOTAL:</span>
                    <span className="font-bold text-emerald-400">{cartTotal} BC</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2 font-bold">
                    <span>ESTIMATED REMAINING:</span>
                    <span className={coins - cartTotal < 0 ? "text-red-400" : "text-emerald-400"}>
                      {coins - cartTotal} BC
                    </span>
                  </div>
                </div>

                {notEnoughCartCredits && cartItems.length > 0 && (
                  <div className="mt-3 p-3 border border-red-500/40 bg-red-950/30 text-red-300 text-xs font-sans flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>
                      Insufficient balance. You need {cartTotal - coins} more BC to checkout all items in your cart.
                    </span>
                  </div>
                )}
              </div>

              {/* Cart Items List */}
              <div className="my-4 flex-1 overflow-y-auto space-y-3 pr-1">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/40">
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
                      <circle cx="8" cy="21" r="1" />
                      <circle cx="19" cy="21" r="1" />
                      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                    </svg>
                    <p className="font-sans text-sm font-semibold text-white/60">Your cart is empty</p>
                    <p className="mt-1 text-xs text-white/40 max-w-xs">
                      Click &quot;ADD CART&quot; on components in the catalog to purchase them together.
                    </p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item._id}
                      className="border border-white/10 bg-black/40 p-3 flex items-center justify-between gap-3 group hover:border-white/20 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-12 w-12 shrink-0 bg-white/95 border border-white/10 p-1 flex items-center justify-center overflow-hidden">
                          {item.resolvedImage ? (
                            <img
                              src={item.resolvedImage}
                              alt={item.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span className="font-mono text-[9px] text-black">HW</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-sans text-sm font-semibold text-white truncate">
                            {item.name}
                          </h4>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase text-white/40">
                              {item.resolvedCategory}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400">
                              {item.price} BC
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item._id)}
                        title="Remove item"
                        className="p-1.5 text-white/40 hover:text-red-400 transition cursor-pointer"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="border-t border-white/10 pt-4 space-y-3">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="font-mono uppercase text-white/70">Total Order:</span>
                  <div className="flex items-center gap-2 text-emerald-400 font-mono text-lg">
                    <Image
                      src="/currency.png"
                      alt="BC"
                      width={20}
                      height={20}
                      className="h-5 w-5 object-contain"
                    />
                    <span>{cartTotal} BC</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={clearCart}
                    disabled={cartItems.length === 0}
                    className="col-span-1 h-[46px] border border-white/15 bg-white/5 font-sans text-xs font-semibold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    disabled={cartItems.length === 0 || notEnoughCartCredits || isCheckingOut}
                    onClick={checkoutCart}
                    className="col-span-2 h-[46px] border border-emerald-400 bg-emerald-400 text-black font-sans text-xs font-bold uppercase tracking-wider hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isCheckingOut ? (
                      <span>PROCESSING...</span>
                    ) : (
                      <>
                        <span>BUY TOGETHER ({cartTotal} BC)</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}