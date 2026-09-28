import connectDB from './mongodb.js';
import Team from '../models/Team.js';
import Stage from '../models/Stage.js';
import Component from '../models/Component.js';
import Admin from '../models/Admin.js';
import BuildProblem from '../models/BuildProblem.js';
import TeamStageState from '../models/TeamStageState.js';
import Purchase from '../models/Purchase.js';
import Transaction from '../models/Transaction.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import fs from 'fs';

async function seed() {
  await connectDB();

  // 1. Seed Build Problem (Core Engineers - Path 01)
  await BuildProblem.deleteMany({});
  await BuildProblem.create({
    pathId: 'path-01',
    pathTitle: 'PATH 01 — "THE SILENT WATCHER"',
    narrative:
      "NEXCORP's east perimeter has gone dark. The anomaly detection grid — a network of motion sensors monitoring restricted zones — has been deliberately disabled. Someone is moving through the facility undetected. Your team has been deployed by the Breach Collective to rebuild the grid from salvaged components. Ghost Operatives must recover the system data scattered across the facility while Core Engineers reconstruct the detection node from scratch. The grid must go live before the next breach window opens.",
    missionBrief:
      "The east perimeter motion node is offline. Salvage the components, reconstruct the anomaly detector, and bring the grid back online. Motion must be detected, logged, and signalled. Every second the grid is dark, NEXCORP moves freely.",
    whatToBuild:
      "A PIR-based motion anomaly detector using ESP8266, PIR sensor, and LED.",
    minimumRequirements: [
      "PIR sensor detects motion and triggers ESP8266",
      "On motion detected — LED blinks as a physical alert signal",
      "ESP8266 publishes an MQTT message to a broker topic (e.g. nexcorp/east/motion)",
      "A simple web page or terminal subscribes to the topic and displays a live log of motion events with timestamps",
    ],
    bonusFeatures: [
      "LED blink pattern changes based on frequency of motion — e.g. slow blink for single event, rapid blink for repeated events within 10 seconds (anomaly mode)",
      "Web dashboard shows total event count and flags anomaly status",
      "System distinguishes between a single motion event and a sustained anomaly (multiple triggers within a short window)",
    ],
    freeMaterials: [
      "Breadboard",
      "Jumper Wires",
      "Resistors (Current Limiting)",
      "USB Programming Cable",
    ],
    components: [
      {
        id: "led",
        name: "LED 5mm Pack",
        cyberpunkName: "Perimeter Signal Lamp",
        cost: 80,
        category: "Output",
        role: "Physical optical alert signal that blinks upon detected perimeter movement",
        imageUrl: "https://cdn.shopify.com/s/files/1/0559/1970/6265/products/5mm_red_led_p10.jpg?v=1743775759",
        status: "Mandatory",
      },
      {
        id: "pir-sensor",
        name: "PIR Motion Sensor",
        cyberpunkName: "Infrared Anomaly Tap",
        cost: 150,
        category: "Sensor",
        role: "Pyroelectric motion sensor detecting movement in restricted sectors",
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRqnVgDj7rsTNsH5bI0FioBkj9d0w18KKXkOlrRGa-Cr0-nfk0gGc0aKtp6&s=10",
        status: "Mandatory",
      },
      {
        id: "esp8266",
        name: "ESP8266 (NodeMCU CP2102)",
        cyberpunkName: "Neural Core Alpha",
        cost: 250,
        category: "Microcontroller",
        role: "Microcontroller logic unit publishing telemetry over Wi-Fi/MQTT",
        imageUrl: "https://cdn.shopify.com/s/files/1/0559/1970/6265/products/51wy76q0icl_e36eddcd-6c05-4f3a-8279-bffebf1ed2aa.jpg?v=1743775624",
        status: "Mandatory",
      },
    ],
    subPoints: [
      {
        id: "REQ-01",
        title: "PIR Motion Detection & ESP8266 Trigger",
        points: "25 pts",
        badge: "Sensory",
        badgeColor: "border-emerald-400/40 text-emerald-300 bg-emerald-400/10",
        items: [
          "PIR sensor is accurately wired to ESP8266 GPIO with stable power rail.",
          "Trigger state reliably registers high logic upon human/object movement.",
          "Software handles PIR settling time and debounce without ghost triggers.",
        ],
      },
      {
        id: "REQ-02",
        title: "Perimeter Signal Lamp (LED Visual Alert)",
        points: "25 pts",
        badge: "Signaling",
        badgeColor: "border-amber-400/40 text-amber-300 bg-amber-400/10",
        items: [
          "LED blinks visibly as an immediate physical alert upon motion detection.",
          "Circuit incorporates proper current-limiting resistor to protect diode.",
          "Bonus: Modulated blink pattern (slow blink for single event vs. rapid flashing for sustained anomaly).",
        ],
      },
      {
        id: "REQ-03",
        title: "MQTT Message Telemetry Publishing",
        points: "25 pts",
        badge: "MQTT Telemetry",
        badgeColor: "border-cyan-400/40 text-cyan-300 bg-cyan-400/10",
        items: [
          "ESP8266 connects to Wi-Fi network and authenticates to MQTT broker.",
          "Publishes an MQTT event payload to target topic (e.g. nexcorp/east/motion) on each trigger.",
          "Payload includes timestamp or incremental event counter.",
        ],
      },
      {
        id: "REQ-04",
        title: "Live Subscriber Dashboard / Terminal Logger",
        points: "25 pts",
        badge: "Monitoring",
        badgeColor: "border-blue-400/40 text-blue-300 bg-blue-400/10",
        items: [
          "Web dashboard or terminal subscribes to nexcorp/east/motion or nexcorp/#.",
          "Displays live chronological event feed with timestamps in real-time.",
          "Bonus: Calculates total motion count and flags active anomaly mode (3+ events in 10s).",
        ],
      },
    ],
    allStagesCompleteMessage:
      "Mission complete. All 5 data fragments recovered. Breach Credits available for component redemption. Proceed to the component shop and bring the grid online.",
  });

  // 2. Seed Stages (Ghost Operatives - Path 01)
  await Stage.deleteMany({});
  await Stage.insertMany([
    {
      stageNumber: 1,
      title: 'Stage 1 - The Silent Watcher',
      type: 'Direct',
      location: 'App Console',
      message:
        "Operative. The east grid's last known transmission was intercepted before the node went dark. To reconstruct the detection pipeline you must first prove you understand how the signal was being routed. Answer correctly to receive your first field coordinates.",
      puzzle:
        "Your motion detection system publishes to an MQTT broker every time the PIR sensor triggers. The topic is nexcorp/east/motion.\n\nThree clients are connected to this broker:\n• A web dashboard subscribed to nexcorp/east/motion\n• A logging server subscribed to nexcorp/#\n• A mobile monitor subscribed to nexcorp/west/motion\n\nThe PIR sensor triggers 4 times.\n\nHow many total MQTT messages are received across all three subscribers?",
      correctAnswer: '8',
      answerAliases: ['8', '8 MESSAGES', 'EIGHT', '8 TOTAL MESSAGES', '8 TOTAL'],
      checkpointKey: '',
      coinsReward: 120,
      wrongPenalty: 0,
      hints: [
        {
          text: 'The # wildcard in MQTT matches all topic levels below it. nexcorp/# matches nexcorp/east/motion.',
          cost: 30,
        },
      ],
      successMessage:
        'Signal pattern confirmed. The first data fragment was cached at the outer perimeter.',
    },
    {
      stageNumber: 2,
      title: 'Stage 2 - The Outer Perimeter',
      type: 'Secret Key',
      location: 'Inside the pipe near the admin building, beside the football ground gate',
      checkpointKey: 'PIPE-2048',
      message:
        'The outer perimeter of this facility has a structure that carries things without moving itself. It stands beside the gate that guards the field where eleven chase one, close to the building that commands the campus. Reach inside it to retrieve the secret access key.',
      puzzle:
        'Your motion detector is live. The PIR sensor triggers and the ESP8266 attempts to publish to the broker. But the web dashboard shows nothing.\n\nYou investigate and find:\n• Broker is running fine\n• ESP8266 is connected to WiFi\n• ESP8266 is publishing to nexcorp/east/motion\n• Web dashboard is subscribed to nexcorp/east/#\n\nIs the dashboard receiving the messages? Write YES or NO.',
      correctAnswer: 'YES',
      answerAliases: [
        'YES',
        'YES THE DASHBOARD RECEIVES THE MESSAGES',
        'YES MQTT HASH WILDCARD MATCHES',
        'YES IT RECEIVES',
      ],
      coinsReward: 140,
      wrongPenalty: 50,
      hints: [
        {
          text: 'In MQTT, # must be the last character in a filter and matches everything below it in the topic tree.',
          cost: 40,
        },
      ],
      successMessage:
        'Fragment recovered. Your next contact is outside. Find them and state the passphrase: The east grid is dark.',
    },
    {
      stageNumber: 3,
      title: 'Stage 3 - The Eight-Bit Contact',
      type: 'Direct',
      location: 'Stationed outside, carrying or wearing something marked with the number 8',
      checkpointKey: 'BYTE-8816',
      message:
        'This operative is positioned outside, not within any building. They carry a visible marker — a number that answers: how many bits make one byte? Approach them and state the passphrase: The east grid is dark.',
      puzzle:
        'Your anomaly detection logic uses a stack to buffer motion events before processing them.\n\nEvents arrive and are pushed in this order: E1, E2, E3, E4, E5\nYou then pop 3 events to process them.\nThen 2 new events arrive and are pushed: E6, E7\n\nWhat is the current state of the stack from bottom to top?',
      correctAnswer: 'E1 E2 E6 E7',
      answerAliases: [
        'E1, E2, E6, E7',
        'E1,E2,E6,E7',
        'E1 E2 E6 E7 FROM BOTTOM TO TOP',
        '[E1, E2, E6, E7]',
        'E1 E2 E6 E7 BOTTOM TO TOP',
      ],
      coinsReward: 160,
      wrongPenalty: 0,
      hints: [
        {
          text: 'A stack is LIFO — last in, first out. Popping removes from the top.',
          cost: 50,
        },
      ],
      successMessage:
        'Contact confirmed. One more physical trace remains in the field.',
    },
    {
      stageNumber: 4,
      title: 'Stage 4 - The Anomaly Window',
      type: 'Secret Key',
      location: 'Behind the bug poster beside the main gate, on the wall behind the ATM',
      checkpointKey: 'GATE-9021',
      message:
        'The final cached fragment is stored at the most visible entry point of the campus. Find the wall that stands behind the machine people visit when they need paper with numbers on it. Something is hidden on that wall nearby — locate the secret access key.',
      puzzle:
        'Your anomaly detection system needs to decide when motion qualifies as an anomaly versus a single event.\n\nYou define an anomaly as: 3 or more motion events within a 10-second window.\n\nEvents are logged with timestamps in seconds from start:\n[0, 4, 9, 15, 17, 19, 22]\n\nHow many anomaly windows exist in this sequence?',
      correctAnswer: '4',
      answerAliases: [
        '4',
        '4 WINDOWS',
        'FOUR',
        '4 ANOMALY WINDOWS',
        'THERE ARE 4 ANOMALY WINDOWS',
      ],
      coinsReward: 180,
      wrongPenalty: 0,
      hints: [
        {
          text: 'Check each event as a potential window start. Count how many events fall within 10 seconds of it including itself. If 3 or more — it qualifies as an anomaly window.',
          cost: 50,
        },
      ],
      successMessage:
        'All field fragments recovered. One final contact remains before you return to base.',
    },
    {
      stageNumber: 5,
      title: 'Stage 5 - The Seven-Layer Key',
      type: 'Direct',
      location: 'Near canteen or waiting area, carrying or wearing something marked with the number 7',
      checkpointKey: 'OSI-7077',
      message:
        'Your final contact is near a place where people gather to rest between tasks — not a lab, not a classroom. They carry a marker equal to the total number of layers in the OSI model. State the passphrase: The east grid is dark.',
      puzzle:
        'Your motion event log needs to replay stored events in the exact order they were originally detected — first detected must be replayed first.\n\nTwo teammates disagree on the data structure to use:\n• Teammate A says: use a Stack\n• Teammate B says: use a Queue\n\nWho is correct? Name them and explain why in one line.',
      correctAnswer: 'TEAMMATE B',
      answerAliases: [
        'TEAMMATE B',
        'B',
        'TEAMMATE B - QUEUE',
        'TEAMMATE B QUEUE',
        'TEAMMATE B QUEUE FIFO',
        'QUEUE FIFO',
        'TEAMMATE B QUEUE PRESERVES FIFO ARRIVAL ORDER',
        'TEAMMATE B IS CORRECT',
        'TEAMMATE B - QUEUES ARE FIFO',
        'TEAMMATE B FIFO',
      ],
      coinsReward: 200,
      wrongPenalty: 50,
      hints: [
        {
          text: 'Think about what order you want events replayed. First detected should come out first — which data structure guarantees that?',
          cost: 60,
        },
      ],
      successMessage:
        'All nodes restored. Return to base immediately. Hand your components to the Core Engineers and execute the breach. The east grid goes live now.',
    },
  ]);

  // 3. Seed Components
  await Component.deleteMany({});
  const componentsRaw = fs.readFileSync(new URL('../data/components.json', import.meta.url), 'utf8');
  const componentsList = JSON.parse(componentsRaw);
  await Component.insertMany(
    componentsList.map((c) => ({
      name: c.name,
      cyberpunkName: c.cyberpunkName || c.name,
      price: c.price,
      stock: c.quantity || 12,
      description: c.description,
      category: c.category,
      imageUrl: c.imageUrl,
    }))
  );

  // 4. Reset team states and seed TEAM01
  await TeamStageState.deleteMany({});
  await Purchase.deleteMany({});
  await Transaction.deleteMany({});

  await Team.deleteMany({});
  await Team.create({
    teamCode: 'TEAM01',
    teamName: 'The Silent Watcher',
    members: ['Core Engineer 1', 'Core Engineer 2'],
    coins: 0,
    currentStage: 1,
    completedStages: [],
    status: 'waiting',
  });

  // 5. Seed Admin
  await Admin.deleteMany({});
  await Admin.create({
    username: 'admin',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin',
  });

  console.log('Path 01 "THE SILENT WATCHER" seed complete.');
  console.log('Build Problem, Stages (1-5), Components, and TEAM01 initialized successfully.');
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});