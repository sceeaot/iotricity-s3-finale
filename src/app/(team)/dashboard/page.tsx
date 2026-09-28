"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Hint = {
  index: number;
  cost: number;
  revealed: boolean;
  text: string | null;
};

type StageData = {
  completed?: boolean;
  coins?: number;
  teamCoins?: number;
  teamName?: string;
  currentStage?: number;
  completedStages?: number[];
  stageNumber?: number;
  title?: string;
  type?: string;
  location?: string;
  message?: string;
  puzzle?: string | null;
  requiresKey?: boolean;
  isPuzzleUnlocked?: boolean;
  coinsReward?: number;
  wrongPenalty?: number;
  hints?: Hint[];
  successMessage?: string;
};

const STAGE_REWARDS: Record<number, number> = {
  1: 120,
  2: 140,
  3: 160,
  4: 180,
  5: 200,
};

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

type RequiredComponent = {
  id: string;
  name: string;
  cyberpunkName: string;
  category: "Microcontroller" | "Sensor" | "Actuator" | "Output" | "Input" | "Display";
  role: string;
  price: number;
  imageUrl: string;
  status: "Mandatory" | "Recommended" | "Optional Extension";
};

const BUILD_COMPONENTS: RequiredComponent[] = [
  {
    id: "esp8266",
    name: "ESP8266 (NodeMCU CP2102)",
    cyberpunkName: "Neural Core Alpha",
    category: "Microcontroller",
    role: "Central 32-bit MCU unit with integrated Wi-Fi stack for MQTT telemetry transmission",
    price: 250,
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/1970/6265/products/51wy76q0icl_e36eddcd-6c05-4f3a-8279-bffebf1ed2aa.jpg?v=1743775624",
    status: "Mandatory",
  },
  {
    id: "pir-sensor",
    name: "PIR Motion Sensor",
    cyberpunkName: "Infrared Anomaly Tap",
    category: "Sensor",
    role: "Pyroelectric infrared motion detector sensing movement in restricted sectors",
    price: 150,
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRqnVgDj7rsTNsH5bI0FioBkj9d0w18KKXkOlrRGa-Cr0-nfk0gGc0aKtp6&s=10",
    status: "Mandatory",
  },
  {
    id: "led",
    name: "LED 5mm Pack",
    cyberpunkName: "Perimeter Signal Lamp",
    category: "Output",
    role: "Physical optical indicator blinking immediately upon detected motion anomaly",
    price: 80,
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/1970/6265/products/5mm_red_led_p10.jpg?v=1743775759",
    status: "Mandatory",
  },
  {
    id: "ultrasonic-sensor",
    name: "Ultrasonic Sensor (HC-SR04)",
    cyberpunkName: "Sonar Pulse Emitter",
    category: "Sensor",
    role: "Non-contact sonar distance detection (2cm-400cm) for secondary perimeter tripwire",
    price: 150,
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/1970/6265/files/1_HC_SR04_Ultrasonic_Sensor_356da2f6-48fc-47f6-a1c8-562ea36f9eee.png?v=1752210992",
    status: "Optional Extension",
  },
  {
    id: "servo-motor",
    name: "Servo Motor (SG90)",
    cyberpunkName: "Kinetic Pivot Actuator",
    category: "Actuator",
    role: "180° mechanical actuation for automated barrier gate or sensor orientation gimbal",
    price: 180,
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/1970/6265/products/SG90_Micro_Servo_Motor.jpg?v=1730885918",
    status: "Optional Extension",
  },
  {
    id: "buzzer",
    name: "Piezo Buzzer Module",
    cyberpunkName: "Acoustic Beacon",
    category: "Output",
    role: "Audible alarm transducer producing warning frequencies upon sustained anomaly",
    price: 80,
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/1970/6265/products/9vbuzzer.jpg?v=1744008524",
    status: "Optional Extension",
  },
  {
    id: "push-button",
    name: "Tactile Push Button",
    cyberpunkName: "Quantum Trigger Switch",
    category: "Input",
    role: "Manual reset override switch for clearing anomaly mode and silencing alert",
    price: 50,
    imageUrl: "https://cdn.shopify.com/s/files/1/0559/1970/6265/products/1_61a13ee6-0ac7-4eaa-b49e-3d75ebbc847d.png?v=1743773742",
    status: "Optional Extension",
  },
];

const SUB_POINTS = [
  {
    id: "REQ-01",
    title: "PIR Motion Detection & ESP8266 Trigger",
    points: "25 pts",
    badge: "Sensory",
    badgeColor: "border-emerald-400/40 text-emerald-300 bg-emerald-400/10",
    items: [
      "PIR sensor detects motion and triggers ESP8266 GPIO reliably.",
      "Handles sensor settling time and debounce without ghost/false triggers.",
      "Hardware wired safely with appropriate power rails and common GND.",
    ],
  },
  {
    id: "REQ-02",
    title: "Physical Alert Signal (Perimeter Signal Lamp)",
    points: "25 pts",
    badge: "Signaling",
    badgeColor: "border-amber-400/40 text-amber-300 bg-amber-400/10",
    items: [
      "On motion detected — LED blinks as an immediate physical alert signal.",
      "Bonus: LED blink pattern changes based on frequency of motion (e.g. slow blink for single event, rapid blink for repeated events within 10s anomaly mode).",
      "Correct current-limiting resistor attached to protect diode.",
    ],
  },
  {
    id: "REQ-03",
    title: "MQTT Message Telemetry Transmission",
    points: "25 pts",
    badge: "MQTT",
    badgeColor: "border-cyan-400/40 text-cyan-300 bg-cyan-400/10",
    items: [
      "ESP8266 connects to Wi-Fi and authenticates to the MQTT broker.",
      "Publishes an MQTT message to broker topic (e.g. nexcorp/east/motion) on each trigger.",
      "Structured message payload includes event identifiers or timestamp data.",
    ],
  },
  {
    id: "REQ-04",
    title: "Live Subscriber Dashboard / Log Feed",
    points: "25 pts",
    badge: "Dashboard",
    badgeColor: "border-blue-400/40 text-blue-300 bg-blue-400/10",
    items: [
      "A simple web page or terminal subscribes to the topic and displays live log of motion events with timestamps.",
      "Bonus: Web dashboard shows total event count and flags anomaly status.",
      "Bonus: System distinguishes between a single motion event and a sustained anomaly (multiple triggers within short window).",
    ],
  },
];

export default function Dashboard() {
  const [data, setData] = useState<StageData | null>(null);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkpointKey, setCheckpointKey] = useState("");
  const [checkpointBusy, setCheckpointBusy] = useState(false);
  const [checkpointError, setCheckpointError] = useState("");
  const [checkpointSuccess, setCheckpointSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"stages" | "project">("stages");
  const router = useRouter();

  const load = useCallback(async () => {
    const response = await fetch("/api/stage/current");
    if (response.status === 401) {
      router.push("/login");
      return;
    }
    setMessage("");
    setCheckpointError("");
    setCheckpointSuccess("");
    setData(await response.json());
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function unlockCheckpoint(event: FormEvent) {
    event.preventDefault();
    if (!checkpointKey.trim()) return;
    setCheckpointBusy(true);
    setCheckpointError("");
    setCheckpointSuccess("");

    try {
      const response = await fetch("/api/stage/unlock-checkpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: checkpointKey }),
      });
      const result = await response.json();
      setCheckpointBusy(false);

      if (!response.ok) {
        setCheckpointError(result.error || "Invalid security key. Please check the code and try again.");
      } else {
        setCheckpointSuccess("Security authorization confirmed! Puzzle statement decrypted.");
        setCheckpointKey("");
        if (result.puzzle) {
          setData((prev) => (prev ? { ...prev, isPuzzleUnlocked: true, puzzle: result.puzzle } : prev));
        }
        setTimeout(() => {
          load();
        }, 500);
      }
    } catch {
      setCheckpointBusy(false);
      setCheckpointError("Connection error while validating security key. Please retry.");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/stage/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    const result = await response.json();
    setBusy(false);
    setMessage(
      result.correct
        ? `Correct! +${result.coinsEarned} BC added.`
        : result.message || result.error,
    );
    if (result.coins !== undefined) {
      setData((prev) => (prev ? { ...prev, coins: result.coins, teamCoins: result.coins } : prev));
    }
    if (result.correct) {
      setAnswer("");
      setTimeout(load, 500);
    } else if (result.penaltyDeducted) {
      load();
    }
  }

  async function unlockHint(index: number, cost: number) {
    if (!window.confirm(`Unlock this hint for ${cost} BC?`)) return;
    const response = await fetch("/api/stage/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hintIndex: index }),
    });
    const result = await response.json();
    if (!response.ok) setMessage(result.error);
    else load();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (!data)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030713] text-white px-4">
        <div className="relative border border-white/20 bg-black/20 p-6 sm:p-8 backdrop-blur-sm text-center">
          <CornerMarks />
          <p className="font-sans text-xs tracking-[0.16em] uppercase text-white/50">
            SYNCING FIELD NODE...
          </p>
        </div>
      </main>
    );

  const completedStages = data.completedStages || [];
  const stageNumber = data.stageNumber ?? 1;
  const formattedTitle = (data.title || `Stage ${stageNumber}`).replace(" - ", " — ");

  return (
    <div className="relative isolate min-h-screen bg-[#030713] text-white overflow-x-hidden">
      <Image
        src="/bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-center fixed pointer-events-none"
      />
      <div aria-hidden="true" className="fixed inset-0 -z-10 bg-[#020611]/75 pointer-events-none" />

      {/* Header */}
      <header className="w-full border-b border-white/10 px-4 py-4 sm:px-10 sm:py-5">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3">
          <a href="/" className="transition hover:opacity-85 shrink-0">
            <Image
              src="/dashboard_logo.png"
              alt="SCEE x IOTRICITY"
              width={160}
              height={28}
              className="h-5 sm:h-7 w-auto object-contain"
              priority
            />
          </a>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Interchangeable Navigation Button */}
            <button
              type="button"
              onClick={() => setActiveTab((prev) => (prev === "stages" ? "project" : "stages"))}
              className="flex items-center justify-center gap-1.5 sm:gap-2 bg-white px-3 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold tracking-wider uppercase text-[#080d19] transition hover:bg-white/85 active:scale-95 shadow-sm"
              title={activeTab === "stages" ? "View Hardware Build Specification" : "Switch to Stage Console"}
            >
              {activeTab === "stages" ? (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span>BUILD SPEC</span>
                </>
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                  <span>STAGE CONSOLE</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={logout}
              aria-label="Disconnect"
              title="Disconnect"
              className="relative flex h-[34px] w-[34px] sm:h-[38px] sm:w-[38px] items-center justify-center border border-white/25 bg-black/15 text-white transition hover:bg-white/10 active:scale-95 shrink-0"
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

      {/* Main Body */}
      <main className="mx-auto max-w-[1320px] px-4 py-6 sm:px-10 sm:py-8 pb-16 animate-rise">
        {/* Welcome & Timer */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-[12px] font-sans tracking-[0.16em] uppercase text-white/40">
              WELCOME
            </p>
            <h1 className="mt-1 font-sans text-2xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl truncate">
              {data.teamName || "Team"}
            </h1>
          </div>
          <div className="text-left font-sans sm:text-right shrink-0">
            <p className="text-[11px] sm:text-[12px] uppercase tracking-[.1em] text-white/50">TIME LEFT</p>
            <p className="text-lg sm:text-[20px] font-medium tabular-nums text-white">03H 55M 22S</p>
          </div>
        </div>

        {activeTab === "stages" ? (
          <>
            {/* Stage Progress Bar */}
            <div className="my-6 sm:my-10 grid grid-cols-5 gap-1.5 sm:gap-6">
              {[1, 2, 3, 4, 5].map((stage) => {
                const isCompleted = completedStages.includes(stage);
                const isActive = stage === stageNumber && !data.completed;
                const reward = STAGE_REWARDS[stage] ?? 120;

                let barColor = "bg-white/15";
                let textColor = "text-white/40";
                let coinOpacity = "opacity-40";

                if (isCompleted) {
                  barColor = "bg-[#00e676]";
                  textColor = "text-white";
                  coinOpacity = "opacity-100";
                } else if (isActive) {
                  barColor = "bg-[#ffb703]";
                  textColor = "text-white";
                  coinOpacity = "opacity-100";
                }

                return (
                  <div key={stage} className="flex flex-col gap-1.5 sm:gap-2">
                    <div className="flex flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-1 text-[10px] xs:text-[11px] sm:text-sm">
                      <span className={`font-medium whitespace-nowrap ${textColor}`}>Stage {stage}</span>
                      <span className={`flex items-center gap-1 font-medium ${textColor}`}>
                        <Image
                          src="/currency.png"
                          alt="BC"
                          width={14}
                          height={14}
                          className={`h-3 w-3 sm:h-3.5 sm:w-3.5 object-contain shrink-0 ${coinOpacity}`}
                        />
                        <span>{reward}</span>
                      </span>
                    </div>
                    <div className={`h-[3px] sm:h-[3.5px] w-full rounded-full ${barColor}`} />
                  </div>
                );
              })}
            </div>

            {/* Completion or Active Stage */}
            {data.completed ? (
              <div className="relative border border-white/20 bg-black/20 p-5 sm:p-8 backdrop-blur-sm">
                <CornerMarks />
                <p className="text-[11px] font-sans font-semibold tracking-[0.16em] uppercase text-emerald-400">
                  MISSION COMPLETE
                </p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-white">
                  All 5 data fragments recovered.
                </h2>
                <p className="mt-3 font-sans text-sm sm:text-base text-white/70 leading-relaxed">
                  All nodes restored. Breach Credits available for component redemption. Return to base immediately, hand your components to the Core Engineers, and bring the grid online.
                </p>
                <a
                  href="/shop"
                  className="mt-6 inline-block w-full sm:w-auto text-center bg-white px-6 py-3 font-bold text-xs sm:text-sm tracking-wider uppercase text-[#080d19] transition hover:bg-white/85"
                >
                  OPEN COMPONENT SHOP
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Stage Info & Question Form */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  {/* Stage Info Card */}
                  <div className="relative border border-white/20 bg-black/20 p-5 sm:p-7 backdrop-blur-sm">
                    <CornerMarks />
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border border-white/20 bg-white/5 text-white/70">
                        {data.type || (stageNumber === 2 || stageNumber === 4 ? "Secret Key" : "Direct")}
                      </span>
                      {data.requiresKey && (
                        <span
                          className={`text-[10px] font-mono tracking-wider px-2 py-0.5 border flex items-center gap-1 ${
                            data.isPuzzleUnlocked
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                          }`}
                        >
                          {data.isPuzzleUnlocked ? "🔓 Decrypted" : "🔒 Secret Key Required"}
                        </span>
                      )}
                    </div>
                    <h2 className="font-sans text-lg sm:text-2xl font-semibold text-white break-words">
                      {formattedTitle}
                    </h2>
                    <p className="mt-3 font-sans text-sm sm:text-base font-light leading-relaxed text-white/60">
                      {data.message}
                    </p>
                  </div>

                  {/* Question & Answer Card OR Checkpoint Lock Card */}
                  {data.requiresKey && !data.isPuzzleUnlocked ? (
                    <div className="relative border border-amber-500/30 bg-[#0c0f1d]/90 p-5 sm:p-7 backdrop-blur-sm">
                      <CornerMarks />
                      <div className="flex items-center gap-2.5 text-amber-400 mb-2">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="shrink-0"
                        >
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <p className="text-[11px] font-sans font-bold tracking-[0.16em] uppercase">
                          CHECKPOINT ENCRYPTED // SECRET KEY REQUIRED
                        </p>
                      </div>

                      <p className="font-sans text-sm sm:text-base font-light leading-relaxed text-white/75 mt-3">
                        {stageNumber === 2 || stageNumber === 4
                          ? "The challenge problem statement is locked behind physical location security. Proceed to the checkpoint location described above, retrieve the secret key, and enter it below to decrypt the puzzle."
                          : "The challenge problem statement is locked behind operative protocol. Track down the field operative using the instructions above, provide the operative passphrase, and enter their secret key below to decrypt the puzzle."}
                      </p>

                      <form onSubmit={unlockCheckpoint} className="mt-6 flex flex-col gap-3">
                        <label className="text-[11px] font-sans font-semibold tracking-[0.14em] uppercase text-amber-300/80">
                          ENTER SECRET KEY
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2.5">
                          <input
                            type="text"
                            value={checkpointKey}
                            onChange={(e) => setCheckpointKey(e.target.value)}
                            placeholder="e.g. PIPE-2048"
                            className="h-[46px] sm:h-[52px] flex-1 border border-amber-500/30 bg-[#080d19]/90 px-4 font-mono text-sm text-white uppercase placeholder:normal-case placeholder:font-sans placeholder:text-white/30 focus:border-amber-400 focus:outline-none transition tracking-wider"
                            required
                          />
                          <button
                            type="submit"
                            disabled={checkpointBusy}
                            className="h-[46px] sm:h-[52px] px-6 bg-amber-400 hover:bg-amber-300 text-[#080d19] font-bold text-xs sm:text-sm tracking-wider uppercase transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
                          >
                            {checkpointBusy ? (
                              "DECRYPTING..."
                            ) : (
                              <>
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                                </svg>
                                <span>DECRYPT PUZZLE</span>
                              </>
                            )}
                          </button>
                        </div>

                        {checkpointError && (
                          <p className="text-xs font-medium text-[#ff4d4d] tracking-wide mt-1">
                            {checkpointError}
                          </p>
                        )}
                        {checkpointSuccess && (
                          <p className="text-xs font-medium text-emerald-400 tracking-wide mt-1">
                            {checkpointSuccess}
                          </p>
                        )}
                      </form>

                      <div className="mt-4 pt-4 border-t border-amber-500/20 text-[11px] font-sans text-white/40 flex items-center gap-2">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-pulse" />
                        <span>Puzzle statement and answer submissions will unlock once verified.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative border border-white/20 bg-black/20 p-5 sm:p-7 backdrop-blur-sm">
                      <CornerMarks />
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-sans font-semibold tracking-[0.16em] uppercase text-white">
                          PROBLEM STATEMENT
                        </p>
                        {data.requiresKey && (
                          <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 flex items-center gap-1">
                            🔓 CHECKPOINT DECRYPTED
                          </span>
                        )}
                      </div>
                      <div className="mt-3 font-sans text-sm sm:text-base font-light leading-relaxed text-white/80 break-words whitespace-pre-line space-y-2">
                        {data.puzzle}
                      </div>
                      <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
                        <input
                          type="text"
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="Type your answer here"
                          className="h-[46px] sm:h-[52px] w-full border border-white/10 bg-[#080d19]/80 px-4 font-sans text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition"
                          required
                        />
                        {Number(data.wrongPenalty || 0) > 0 && (
                          <p className="text-[11px] font-mono text-amber-300/80">
                            Notice: An incorrect submission will deduct {data.wrongPenalty} Breach Credits from your team balance.
                          </p>
                        )}
                        {message && (
                          <p
                            className={`text-xs font-medium ${
                              message.startsWith("Correct") ? "text-emerald-400" : "text-[#ff4d4d]"
                            }`}
                          >
                            {message}
                          </p>
                        )}
                        <button
                          type="submit"
                          disabled={busy}
                          className="h-[46px] sm:h-[50px] w-full bg-white text-[#080d19] font-bold text-xs sm:text-sm tracking-wider uppercase transition hover:bg-white/85 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busy ? "CHECKING ANSWER..." : "SUBMIT ANSWER"}
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Right Column: Breach Credits & Hints */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {/* Breach Credits Card */}
                  <div className="relative border border-white/20 bg-black/20 p-5 sm:p-7 backdrop-blur-sm">
                    <CornerMarks />
                    <p className="text-[11px] font-sans font-semibold tracking-[0.16em] uppercase text-white/70">
                      AVAILABLE BREACH CREDITS
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <Image
                          src="/currency.png"
                          alt="BC"
                          width={44}
                          height={44}
                          className="h-8 w-8 sm:h-11 sm:w-11 object-contain shrink-0"
                        />
                        <span className="font-display text-2xl sm:text-4xl font-bold text-white">
                          {data.teamCoins ?? data.coins ?? 0}
                        </span>
                      </div>
                      <a
                        href="/shop"
                        className="bg-white px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold tracking-wider uppercase text-[#080d19] transition hover:bg-white/85 shrink-0"
                      >
                        SHOP
                      </a>
                    </div>
                  </div>

                  {/* Get More Clues */}
                  <div>
                    <p className="mb-3 text-[11px] font-sans font-semibold tracking-[0.16em] uppercase text-white/70">
                      GET MORE CLUES
                    </p>
                    <div className="flex flex-col gap-3">
                      {(data.hints || []).map((hint) => (
                        <div
                          key={hint.index}
                          className="relative border border-white/20 bg-black/20 p-4 sm:p-5 backdrop-blur-sm"
                        >
                          <CornerMarks />
                          {hint.revealed ? (
                            <p className="font-sans text-xs sm:text-sm text-white/60 leading-relaxed break-words">
                              {hint.text}
                            </p>
                          ) : (
                            <button
                              type="button"
                              onClick={() => unlockHint(hint.index, hint.cost)}
                              className="flex w-full items-center justify-center gap-2 py-1 text-xs sm:text-sm font-medium text-white transition hover:text-white/80 active:scale-95"
                            >
                              <Image
                                src="/ant-design_lock-filled.png"
                                alt="Lock"
                                width={16}
                                height={16}
                                className="h-4 w-4 object-contain brightness-200 shrink-0"
                              />
                              <span>Unlock for</span>
                              <Image
                                src="/currency.png"
                                alt="BC"
                                width={14}
                                height={14}
                                className="h-3.5 w-3.5 object-contain shrink-0"
                              />
                              <span>{hint.cost}</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Build Specification View */
          <div className="mt-6 sm:mt-8 flex flex-col gap-6 sm:gap-8 animate-rise">
            {/* Mission Overview Card */}
            <div className="relative border border-white/20 bg-black/20 p-5 sm:p-8 backdrop-blur-sm">
              <CornerMarks />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <span className="inline-block text-[11px] font-sans font-semibold tracking-[0.16em] uppercase text-emerald-400">
                    PATH 01 // CORE ENGINEERS MISSION BRIEF
                  </span>
                  <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white">
                    PATH 01 — "THE SILENT WATCHER"
                  </h2>
                </div>
                <div className="flex items-center gap-3 bg-white/5 border border-white/15 px-4 py-2.5 rounded-sm shrink-0">
                  <Image src="/currency.png" alt="BC" width={24} height={24} className="h-6 w-6 object-contain shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/50">AVAILABLE CREDITS</p>
                    <p className="text-lg font-bold text-white leading-tight">{data.teamCoins ?? data.coins ?? 0} BC</p>
                  </div>
                  <a
                    href="/shop"
                    className="ml-2 bg-white px-3.5 py-1.5 text-xs font-bold text-[#080d19] tracking-wider uppercase transition hover:bg-white/85"
                  >
                    SHOP →
                  </a>
                </div>
              </div>

              <div className="mt-5 space-y-4 text-sm sm:text-base font-light text-white/70 leading-relaxed">
                <div className="border-l-2 border-emerald-400/60 pl-3.5 py-1 bg-white/[0.02]">
                  <p className="text-xs uppercase tracking-wider font-semibold text-emerald-400 mb-1">Mission Brief:</p>
                  <p className="text-white/90 italic">
                    "The east perimeter motion node is offline. Salvage the components, reconstruct the anomaly detector, and bring the grid back online. Motion must be detected, logged, and signalled. Every second the grid is dark, NEXCORP moves freely."
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-white/50 mb-1">Operational Narrative:</p>
                  <p>
                    NEXCORP's east perimeter has gone dark. The anomaly detection grid — a network of motion sensors monitoring restricted zones — has been deliberately disabled. Someone is moving through the facility undetected. Your team has been deployed by the Breach Collective to rebuild the grid from salvaged components. Ghost Operatives must recover the system data scattered across the facility while Core Engineers reconstruct the detection node from scratch. The grid must go live before the next breach window opens.
                  </p>
                </div>

                <div className="border border-white/15 bg-white/[0.03] p-4">
                  <span className="text-xs uppercase tracking-wider font-semibold text-white block mb-1">What to Build:</span>
                  <p className="text-white font-medium">
                    A PIR-based motion anomaly detector using ESP8266, PIR sensor, and LED.
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-Points & Deliverables to Fulfill */}
            <div>
              <div className="mb-4">
                <p className="text-[11px] font-sans font-semibold tracking-[0.16em] uppercase text-white/70">
                  CORE REQUIREMENTS & EVALUATION CRITERIA (100 PTS TOTAL)
                </p>
                <p className="text-xs text-white/40">
                  Minimum requirements must be demonstrated alongside optional anomaly bonus features.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SUB_POINTS.map((sp) => (
                  <div
                    key={sp.id}
                    className="relative border border-white/15 bg-black/25 p-5 sm:p-6 backdrop-blur-sm flex flex-col justify-between"
                  >
                    <CornerMarks size={6} />
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-white/40">{sp.id}</span>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 border ${sp.badgeColor}`}>
                            {sp.badge}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5">
                          {sp.points}
                        </span>
                      </div>
                      <h3 className="font-sans text-base font-semibold text-white">
                        {sp.title}
                      </h3>
                      <ul className="mt-3 space-y-2 text-xs sm:text-sm text-white/60">
                        {sp.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-400 mt-0.5 shrink-0">▸</span>
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Components Required Section */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                  <p className="text-[11px] font-sans font-semibold tracking-[0.16em] uppercase text-white/70">
                    COMPONENTS TO REDEEM FROM DISPATCH DESK (480 BC TOTAL)
                  </p>
                  <p className="text-xs text-white/40">
                    Basic materials provided free: breadboard, jumper wires, resistors.
                  </p>
                </div>
                <a
                  href="/shop"
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>Go to Component Shop</span>
                  <span>→</span>
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {BUILD_COMPONENTS.map((comp) => (
                  <div
                    key={comp.id}
                    className="relative border border-white/15 bg-black/25 p-4 sm:p-5 backdrop-blur-sm flex flex-col justify-between transition hover:border-white/30"
                  >
                    <CornerMarks size={6} />
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border border-white/20 bg-white/5 text-white/60">
                          {comp.category}
                        </span>
                        <span
                          className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-sm ${
                            comp.status === "Mandatory"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : comp.status === "Recommended"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}
                        >
                          {comp.status}
                        </span>
                      </div>

                      <div className="flex gap-3 items-start">
                        <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 border border-white/10 bg-[#080d19] p-1 flex items-center justify-center">
                          <img
                            src={comp.imageUrl}
                            alt={comp.name}
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-sans text-sm sm:text-base font-semibold text-white leading-snug">
                            {comp.name}
                          </h3>
                          <p className="text-[11px] font-mono text-emerald-400/90 mt-0.5">
                            {comp.cyberpunkName}
                          </p>
                          <p className="mt-1 text-xs text-white/50 leading-relaxed line-clamp-2">
                            {comp.role}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Image
                          src="/currency.png"
                          alt="BC"
                          width={16}
                          height={16}
                          className="h-4 w-4 object-contain"
                        />
                        <span className="font-display text-base font-bold text-white">
                          {comp.price} BC
                        </span>
                      </div>
                      <a
                        href="/shop"
                        className="text-[11px] font-semibold uppercase tracking-wider text-white/70 hover:text-white transition"
                      >
                        Redeem in Shop →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Field Operational Protocol & Free Materials */}
            <div className="relative border border-white/20 bg-black/20 p-5 sm:p-7 backdrop-blur-sm">
              <CornerMarks />
              <p className="text-[11px] font-sans font-semibold tracking-[0.16em] uppercase text-amber-400">
                DISPATCH DESK & PROTOTYPING PROTOCOL
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm text-white/60">
                <div className="border border-white/10 p-3.5 bg-white/[0.02]">
                  <span className="text-white font-semibold block mb-1">1. Free Materials Provided</span>
                  <p>Breadboard, jumper wires, current-limiting resistors, and USB cable are provided free at the hardware desk.</p>
                </div>
                <div className="border border-white/10 p-3.5 bg-white/[0.02]">
                  <span className="text-white font-semibold block mb-1">2. Target Hardware: 480 BC</span>
                  <p>Redeem LED (80 BC), PIR Sensor (150 BC), and ESP8266 (250 BC) using credits earned from Ghost Operatives solving stages.</p>
                </div>
                <div className="border border-white/10 p-3.5 bg-white/[0.02]">
                  <span className="text-white font-semibold block mb-1">3. Live Grid Demonstration</span>
                  <p>Demonstrate PIR trigger, LED alert, MQTT publish to nexcorp/east/motion, and live subscriber log before time expires.</p>
                </div>
              </div>
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab("stages")}
                  className="w-full sm:w-auto border border-white/30 px-5 py-2.5 text-xs font-semibold tracking-wider uppercase text-white hover:bg-white/10 transition text-center"
                >
                  ← RETURN TO STAGE CONSOLE
                </button>
                <a
                  href="/shop"
                  className="w-full sm:w-auto bg-white px-6 py-2.5 text-xs font-bold tracking-wider uppercase text-[#080d19] hover:bg-white/85 transition text-center"
                >
                  OPEN COMPONENT SHOP →
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
