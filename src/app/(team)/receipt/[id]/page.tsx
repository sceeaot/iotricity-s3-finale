"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import componentsData from "@/data/components.json";

type ReceiptItem = {
  _id?: string;
  componentId?: string;
  componentName: string;
  category?: string;
  imageUrl?: string;
  pricePaid: number;
  dispatched?: boolean;
  dispatchedAt?: string | null;
};

type ReceiptData = {
  receiptId: string;
  teamName: string;
  teamId?: string;
  purchasedAt: string;
  dispatched: boolean;
  dispatchedAt?: string | null;
  totalPaid: number;
  itemCount: number;
  items: ReceiptItem[];
};

type JsonComponent = {
  id: string;
  name: string;
  imageUrl: string;
  category?: string;
};

const typedComponentsData = componentsData as JsonComponent[];

function resolveItemImage(name: string, existingUrl?: string): string {
  if (existingUrl && existingUrl.trim().length > 0) return existingUrl;
  const nameLower = (name || "").toLowerCase();
  const match = typedComponentsData.find(
    (c) =>
      c.name.toLowerCase() === nameLower ||
      c.id.toLowerCase() === nameLower ||
      nameLower.includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(nameLower)
  );
  return match?.imageUrl || typedComponentsData[0]?.imageUrl || "";
}

function CornerMarks({ size = 8 }: { size?: number }) {
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

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/shop/receipt/${id}`)
      .then((r) => {
        if (r.status === 401) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        if (d.error) {
          setError(d.error);
        } else if (d.receipt) {
          setReceipt(d.receipt);
        } else if (d.purchase) {
          // Backward compatibility
          const p = d.purchase;
          setReceipt({
            receiptId: p.receiptId,
            teamName: p.teamName,
            teamId: p.teamId,
            purchasedAt: p.purchasedAt,
            dispatched: p.dispatched,
            dispatchedAt: p.dispatchedAt,
            totalPaid: p.pricePaid,
            itemCount: p.items?.length || 1,
            items: p.items || [
              {
                componentName: p.componentName,
                pricePaid: p.pricePaid,
                category: "Hardware Module",
                dispatched: p.dispatched,
              },
            ],
          });
        }
      })
      .catch((e) => {
        console.error(e);
        setError("Failed to load receipt details.");
      });
  }, [id, router]);

  function copyReceiptId() {
    if (!receipt) return;
    navigator.clipboard.writeText(receipt.receiptId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (error) {
    return (
      <main className="relative isolate min-h-screen bg-[#030713] text-white flex items-center justify-center p-6">
        <div className="relative max-w-md w-full border border-red-500/40 bg-red-950/20 p-8 backdrop-blur-md text-center">
          <CornerMarks />
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border border-red-500/50 bg-red-500/10 flex items-center justify-center text-red-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-xl font-bold font-sans text-red-300">RECEIPT ERROR</h1>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <a
              href="/shop"
              className="px-4 py-2 border border-white/20 bg-white/10 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/20 transition"
            >
              Back to Shop
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (!receipt) {
    return (
      <main className="relative isolate min-h-screen bg-[#030713] text-white flex items-center justify-center p-6">
        <div className="relative border border-white/20 bg-black/40 p-8 backdrop-blur-sm">
          <CornerMarks />
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <p className="font-mono text-xs tracking-[0.2em] uppercase text-white/70">
              RETRIEVING TRANSACTION RECORD...
            </p>
          </div>
        </div>
      </main>
    );
  }

  const dateStr = new Date(receipt.purchasedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="relative isolate min-h-screen bg-[#030713] text-white selection:bg-emerald-500 selection:text-black">
      {/* Background Graphic */}
      <Image
        src="/bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-center fixed opacity-35 pointer-events-none print:hidden"
      />
      <div aria-hidden="true" className="fixed inset-0 -z-10 bg-[#020611]/80 pointer-events-none print:hidden" />

      {/* Top Navigation Bar - Hidden on Print */}
      <header className="print:hidden w-full border-b border-white/10 px-6 py-4 sm:px-10 backdrop-blur-md bg-black/30">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between">
          <a href="/shop" className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/70 hover:text-white transition group">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:-translate-x-1 transition-transform"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>RETURN TO SHOP</span>
          </a>
          <div className="flex items-center gap-3">
            <a
              href="/dashboard"
              className="border border-white/20 bg-black/40 px-3.5 py-2 text-xs font-semibold tracking-wider uppercase text-white hover:bg-white/10 transition"
            >
              CONSOLE
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 border border-emerald-400/50 bg-emerald-500/20 px-4 py-2 text-xs font-bold tracking-wider uppercase text-emerald-300 hover:bg-emerald-500/30 transition cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>PRINT / PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-[820px] px-4 py-8 sm:px-8 sm:py-12">
        {/* Receipt Outer Card */}
        <div className="relative border border-white/20 bg-[#090d18]/90 p-6 sm:p-10 backdrop-blur-md shadow-2xl print:border-black print:bg-white print:text-black print:p-6 print:shadow-none">
          <CornerMarks size={12} />

          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-white/10 pb-6 print:border-black">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 print:hidden" />
                <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-emerald-400 print:text-black font-semibold">
                  IOTRICITY // HARDWARE EXCHANGE
                </p>
              </div>
              <h1 className="mt-1.5 font-sans text-2xl sm:text-3xl font-bold tracking-tight text-white print:text-black">
                Official Hardware Receipt
              </h1>
              <p className="mt-1 font-sans text-xs text-white/50 print:text-neutral-600">
                Component issuance and distribution voucher for registered teams.
              </p>
            </div>

            {/* Receipt ID Box */}
            <div className="self-start sm:self-end text-left sm:text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 print:text-neutral-500 block">
                RECEIPT IDENTIFIER
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-base sm:text-lg font-bold tracking-wider text-white print:text-black bg-white/5 px-2.5 py-1 border border-white/15 print:border-black">
                  #{receipt.receiptId}
                </span>
                <button
                  type="button"
                  onClick={copyReceiptId}
                  title="Copy Receipt ID"
                  className="print:hidden p-1.5 border border-white/15 bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition cursor-pointer"
                >
                  {copied ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Status Alert Banner */}
          <div className="mt-6">
            {receipt.dispatched ? (
              <div className="border border-emerald-500/40 bg-emerald-950/30 p-4 text-emerald-300 flex items-center justify-between gap-4 print:border-black print:bg-neutral-100 print:text-black">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full border border-emerald-400/50 bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-sans text-sm font-bold tracking-wider uppercase">
                      STATUS: DISPATCHED &amp; RELEASED
                    </h2>
                    <p className="text-xs text-emerald-400/80 print:text-neutral-600 mt-0.5">
                      Hardware has been verified and released to team representatives.
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 border border-emerald-500/40 bg-emerald-500/10 uppercase tracking-wider shrink-0 print:border-black">
                  COMPLETE
                </span>
              </div>
            ) : (
              <div className="border border-amber-500/40 bg-amber-950/20 p-4 text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:border-black print:bg-neutral-100 print:text-black">
                <div className="flex items-center gap-3">
                  <div className="relative h-8 w-8 rounded-full border border-amber-400/50 bg-amber-500/20 flex items-center justify-center shrink-0">
                    <span className="absolute h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping print:hidden" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  </div>
                  <div>
                    <h2 className="font-sans text-sm font-bold tracking-wider uppercase">
                      STATUS: PENDING DISPATCH
                    </h2>
                    <p className="text-xs text-amber-200/75 print:text-neutral-600 mt-0.5">
                      Present this receipt at the Hardware Dispatch Desk to collect your modules.
                    </p>
                  </div>
                </div>
                <div className="text-right sm:text-right font-mono text-xs text-amber-300/80 print:text-black">
                  WAITING FOR HANDOFF
                </div>
              </div>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-white/10 py-5 print:border-black">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 print:text-neutral-500 block">
                TEAM NAME
              </span>
              <p className="mt-1 font-sans text-sm font-bold text-white print:text-black truncate">
                {receipt.teamName}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 print:text-neutral-500 block">
                TIMESTAMP
              </span>
              <p className="mt-1 font-mono text-xs text-white/90 print:text-black">
                {dateStr}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 print:text-neutral-500 block">
                PAYMENT METHOD
              </span>
              <p className="mt-1 font-mono text-xs text-white/90 print:text-black">
                Balance Credits (BC)
              </p>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 print:text-neutral-500 block">
                TOTAL ITEMS
              </span>
              <p className="mt-1 font-mono text-xs font-bold text-emerald-400 print:text-black">
                {receipt.items.length} {receipt.items.length === 1 ? "Component" : "Components"}
              </p>
            </div>
          </div>

          {/* Itemized Hardware Components */}
          <div className="mt-6">
            <h2 className="font-sans text-xs font-semibold tracking-[0.16em] uppercase text-white/50 print:text-black mb-3">
              ISSUED HARDWARE COMPONENTS
            </h2>

            <div className="space-y-3">
              {receipt.items.map((item, idx) => {
                const img = resolveItemImage(item.componentName, item.imageUrl);
                return (
                  <div
                    key={item._id || idx}
                    className="flex items-center justify-between gap-4 border border-white/10 bg-black/30 p-3.5 transition hover:border-white/20 print:border-neutral-300 print:bg-white"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-12 w-12 shrink-0 bg-white/90 border border-white/20 p-1 flex items-center justify-center overflow-hidden print:border-black">
                        {img ? (
                          <img
                            src={img}
                            alt={item.componentName}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="text-black font-mono text-[9px] font-bold">HW</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-sans text-sm font-semibold text-white print:text-black truncate">
                          {item.componentName}
                        </h3>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 border border-white/10 bg-white/5 text-white/60 print:border-black print:text-black">
                            {item.category || "Module"}
                          </span>
                          <span className="text-[10px] font-mono text-white/40 print:text-neutral-500">
                            QTY: 1
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-1.5">
                        <Image
                          src="/currency.png"
                          alt="BC"
                          width={16}
                          height={16}
                          className="h-4 w-4 object-contain print:hidden"
                        />
                        <span className="font-sans text-sm font-bold text-white print:text-black">
                          {item.pricePaid} BC
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 print:text-neutral-600 block mt-0.5">
                        {item.dispatched ? "DISPATCHED" : "VERIFIED"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="mt-6 border-t border-white/10 pt-5 print:border-black">
            <div className="flex flex-col gap-2 max-w-xs ml-auto">
              <div className="flex justify-between text-xs text-white/60 print:text-neutral-600 font-mono">
                <span>SUBTOTAL:</span>
                <span>{receipt.totalPaid} BC</span>
              </div>
              <div className="flex justify-between text-xs text-white/60 print:text-neutral-600 font-mono">
                <span>EQUIPMENT SUBSIDY:</span>
                <span>0 BC</span>
              </div>
              <div className="flex justify-between items-center text-base sm:text-lg font-bold border-t border-white/15 pt-2 text-white print:border-black print:text-black">
                <span className="tracking-tight">TOTAL PAID:</span>
                <div className="flex items-center gap-2 text-emerald-400 print:text-black">
                  <Image
                    src="/currency.png"
                    alt="BC"
                    width={22}
                    height={22}
                    className="h-5 w-5 object-contain print:hidden"
                  />
                  <span>{receipt.totalPaid} BC</span>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Barcode & Desk Validation Box */}
          <div className="mt-8 border border-white/10 bg-black/40 p-5 print:border-black print:bg-neutral-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
              {/* Simulated Barcode */}
              <div className="flex flex-col items-center sm:items-start">
                <div className="flex items-end gap-[3px] h-10 px-2 py-1 bg-white print:border print:border-black">
                  {[4, 2, 6, 3, 5, 2, 7, 4, 3, 8, 2, 5, 4, 2, 6, 3, 7, 2, 5, 3, 6, 2, 4, 8, 3, 5].map((h, i) => (
                    <div
                      key={i}
                      className="bg-black w-[2px]"
                      style={{ height: `${h * 4 + 6}px` }}
                    />
                  ))}
                </div>
                <span className="font-mono text-[9px] tracking-[0.25em] text-white/40 print:text-neutral-500 mt-1">
                  *{receipt.receiptId}*
                </span>
              </div>

              {/* Instructions */}
              <div className="text-center sm:text-right max-w-sm">
                <p className="font-mono text-[10px] uppercase text-white/50 print:text-neutral-600 leading-relaxed">
                  Present this receipt or Receipt ID at the central component distribution desk. The physical receipt or digital verification code must be inspected prior to hardware release.
                </p>
              </div>
            </div>

            {/* Coordinator Signature Box for Print */}
            <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-6 print:border-black">
              <div>
                <span className="text-[9px] font-mono uppercase text-white/40 print:text-neutral-500 block">
                  COORDINATOR SIGNATURE
                </span>
                <div className="h-8 border-b border-white/20 print:border-black mt-1" />
              </div>
              <div>
                <span className="text-[9px] font-mono uppercase text-white/40 print:text-neutral-500 block">
                  TEAM REPRESENTATIVE SIGNATURE
                </span>
                <div className="h-8 border-b border-white/20 print:border-black mt-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Below Receipt - Hidden on Print */}
        <div className="print:hidden mt-6 flex flex-wrap items-center justify-between gap-4">
          <a
            href="/shop"
            className="flex items-center gap-2 border border-white/20 bg-white/5 px-5 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            <span>BACK TO SHOP</span>
          </a>

          <div className="flex items-center gap-3">
            <a
              href="/dashboard"
              className="border border-white/20 bg-transparent px-5 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/10 transition"
            >
              GO TO CONSOLE
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 border border-white bg-white px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider text-black hover:bg-white/90 transition cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>PRINT RECEIPT</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}