import connectDB from './mongodb.js';
import Team from '../models/Team.js';
import Stage from '../models/Stage.js';
import Component from '../models/Component.js';
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

async function seed() {
await connectDB();

await Stage.deleteMany({});
await Stage.insertMany([
  {
    stageNumber: 1,
    title: 'Stage 1 - The Silent Watcher',
    message: 'The east corridor node is offline. Last known transmission was intercepted mid-route. Before you can rebuild the grid, you need to prove you understand how the signal travels. Answer this to receive your first field coordinates.',
    puzzle: 'MQTT uses publish-subscribe communication. A sensor publishes 3 motion events to nexcorp/motion. A web dashboard, a mobile app, and a logging server are subscribed. All events use QoS 0. How many total messages are received across all three subscribers?',
    successMessage: 'Coordinates confirmed. The first signal trace leads to the oldest part of the campus perimeter. Find the pipe that stands beside the gate of the football ground, near the admin building. Look inside.',
    correctAnswer: '9',
    coinsReward: 150,
    hints: [
      { text: 'Every published event is delivered independently to each matching subscriber.', cost: 50 },
      { text: 'Multiply the 3 motion events by the 3 subscribed clients.', cost: 75 },
    ],
  },
  {
    stageNumber: 2,
    title: 'Stage 2 - The Outer Perimeter',
    message: 'The first corrupted data packet was traced to the outer perimeter. There is a structure near the admin building - not a door, not a wall, but something that carries things through. It stands beside the gate that guards the field where eleven chase one. Reach inside.',
    puzzle: 'The motion detector publishes to nexcorp/east/corridor/motion. A subscriber uses the wildcard filter nexcorp/east/#. Will this subscriber receive the messages? Answer YES or NO and give one reason in one line.',
    successMessage: 'Signal recovered. The second trace points inward - seek the one who carries a marker with the number of bits in a single byte. They are not indoors. Find them before the grid goes dark.',
    correctAnswer: 'YES',
    answerAliases: ['YES - THE # WILDCARD MATCHES ALL REMAINING LEVELS', 'YES THE # WILDCARD MATCHES ALL REMAINING LEVELS', 'YES MQTT HASH WILDCARD MATCHES ALL REMAINING LEVELS'],
    coinsReward: 175,
    hints: [
      { text: 'The filter begins with the same two topic levels as the published message.', cost: 50 },
      { text: 'In MQTT, # matches all remaining topic levels.', cost: 75 },
    ],
  },
  {
    stageNumber: 3,
    title: 'Stage 3 - The Eight-Bit Contact',
    message: 'This contact is stationed outside, not inside any building. They carry a visible marker - a number that answers the question: how many bits make one byte? Find them and request the next data fragment.',
    puzzle: 'A motion event logger pushes M1, M2, M3, and M4 onto a stack. It pops twice and processes those events. Then M5 arrives and is pushed. What is the current state of the stack from bottom to top?',
    successMessage: 'Fragment retrieved. One more physical trace remains before the node can be rebuilt. Head to the main gate. Find the wall behind the machine that dispenses currency. There is something on that wall - behind it.',
    correctAnswer: 'M1 M2 M5',
    answerAliases: ['M1,M2,M5', 'M1 M2 M5 FROM BOTTOM TO TOP'],
    coinsReward: 200,
    hints: [
      { text: 'A stack is LIFO: the newest items leave first.', cost: 50 },
      { text: 'M3 and M4 are popped. M1 and M2 remain before M5 arrives.', cost: 75 },
    ],
  },
  {
    stageNumber: 4,
    title: 'Stage 4 - The Topic Mismatch',
    message: 'The final corrupted packet was stored at the most visible point of entry to the campus. Find the wall that stands behind the machine people visit when they need paper with numbers on it. Something is pinned nearby - look behind it.',
    puzzle: 'The broker, Wi-Fi, dashboard connection, and publishing are working. The ESP8266 publishes to nexcorp/motion/east, but the dashboard subscribes to nexcorp/motion. What is the exact bug and how do you fix it in one line?',
    successMessage: 'All fragments recovered. Return to base. Your final contact is waiting - find the one marked with the total number of OSI layers. They will hand you the last key before you can rebuild the node.',
    correctAnswer: 'TOPIC MISMATCH',
    answerAliases: ['TOPIC MISMATCH FIX SUBSCRIPTION TO NEXCORP/MOTION/EAST', 'CHANGE DASHBOARD SUBSCRIPTION TO NEXCORP/MOTION/EAST', 'USE NEXCORP/MOTION/#'],
    coinsReward: 225,
    hints: [
      { text: 'Compare the exact publish topic with the exact subscription topic.', cost: 50 },
      { text: 'The dashboard must subscribe to nexcorp/motion/east or nexcorp/motion/#.', cost: 75 },
    ],
  },
  {
    stageNumber: 5,
    title: 'Stage 5 - The Seven-Layer Key',
    message: 'Your last contact stands near a place where people sit and wait but rarely work. They carry a marker with a number - the total count of layers in the OSI model. Approach them and give the passphrase: The east wing is dark.',
    puzzle: 'The motion logger must replay events in the exact order detected: first detected, first replayed. Junior A says use a Stack. Junior B says use a Queue. Who is correct and why in one line?',
    successMessage: 'All nodes restored. Return to base and execute the breach. The east wing is back online. Build it.',
    correctAnswer: 'JUNIOR B',
    answerAliases: ['B', 'JUNIOR B QUEUE FIFO', 'QUEUE FIFO FIRST IN FIRST OUT'],
    coinsReward: 250,
    hints: [
      { text: 'The required order is first detected, first replayed.', cost: 75 },
      { text: 'FIFO preserves arrival order. Which data structure is FIFO?', cost: 100 },
    ],
  },
]);

await Component.deleteMany({});
await Component.insertMany([
  { name: 'Basic Sensor', cyberpunkName: 'Signal Tap Module', price: 150, stock: 12, description: 'PIR input module for the motion node.' },
  { name: 'Supporting Module', cyberpunkName: 'Neural Bridge Unit', price: 200, stock: 12, description: 'Interface hardware for the field build.' },
  { name: 'Processing Unit', cyberpunkName: 'Cortex Relay', price: 250, stock: 12, description: 'Edge processing for event signals.' },
  { name: 'ESP8266 - Core MCU', cyberpunkName: 'Neural Core Alpha', price: 300, stock: 12, description: 'Wi-Fi microcontroller for MQTT publishing.' },
]);

await Team.deleteMany({});
await Team.create({ teamCode: 'TEAM01', teamName: 'The Silent Watcher', members: ['Core Engineer 1', 'Core Engineer 2'], coins: 0, currentStage: 1, completedStages: [], status: 'waiting' });

await Admin.deleteMany({});
await Admin.create({ username: 'admin', password: await bcrypt.hash('admin123', 10), role: 'admin' });

console.log('Path 01 seed complete. Team code: TEAM01. Admin: admin / admin123.');
await mongoose.disconnect();
}

seed().catch((error) => { console.error(error); process.exit(1); });