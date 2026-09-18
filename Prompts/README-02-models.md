# TASK 02 - MongoDB Models

## What you are doing
Creating all mongoose models. These are the database schemas for every
collection the app will use. No UI, no API routes yet - just the models.

---

## File: models/Team.js

```js
import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  teamCode: { type: String, required: true, unique: true },
  teamName: { type: String, required: true },
  members: [String],
  coins: { type: Number, default: 0 },
  currentStage: { type: Number, default: 1 },
  completedStages: { type: [Number], default: [] },
  startTime: { type: Date, default: null },
  status: { type: String, enum: ['waiting', 'active', 'completed'], default: 'waiting' },
}, { timestamps: true });

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);
```

---

## File: models/Stage.js

```js
import mongoose from 'mongoose';

const HintSchema = new mongoose.Schema({
  text: String,
  cost: Number,
});

const StageSchema = new mongoose.Schema({
  stageNumber: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  coinsReward: { type: Number, required: true },
  hints: [HintSchema],
});

export default mongoose.models.Stage || mongoose.model('Stage', StageSchema);
```

---

## File: models/TeamStageState.js

```js
import mongoose from 'mongoose';

const TeamStageStateSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  stageNumber: { type: Number, required: true },
  isUnlocked: { type: Boolean, default: false },
  isSolved: { type: Boolean, default: false },
  solvedAt: { type: Date, default: null },
  hintsRevealed: { type: [Number], default: [] },
  attempts: { type: Number, default: 0 },
  wrongGuesses: { type: Number, default: 0 },
});

export default mongoose.models.TeamStageState ||
  mongoose.model('TeamStageState', TeamStageStateSchema);
```

---

## File: models/Transaction.js

```js
import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  type: {
    type: String,
    enum: ['earned', 'spent', 'hint', 'penalty', 'override'],
    required: true,
  },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.Transaction ||
  mongoose.model('Transaction', TransactionSchema);
```

---

## File: models/Component.js

```js
import mongoose from 'mongoose';

const ComponentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cyberpunkName: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 12 },
  description: { type: String, default: '' },
});

export default mongoose.models.Component ||
  mongoose.model('Component', ComponentSchema);
```

---

## File: models/Purchase.js

```js
import mongoose from 'mongoose';

const PurchaseSchema = new mongoose.Schema({
  receiptId: { type: String, required: true, unique: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  teamName: { type: String, required: true },
  componentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Component', required: true },
  componentName: { type: String, required: true },
  cyberpunkName: { type: String, required: true },
  pricePaid: { type: Number, required: true },
  purchasedAt: { type: Date, default: Date.now },
  dispatched: { type: Boolean, default: false },
  dispatchedAt: { type: Date, default: null },
});

export default mongoose.models.Purchase ||
  mongoose.model('Purchase', PurchaseSchema);
```

---

## File: models/Admin.js

```js
import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'volunteer'], default: 'admin' },
});

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
```

---

## Seed the database

Create `lib/seed.js` and run it once to insert initial data:

```js
import connectDB from './mongodb.js';
import Stage from '../models/Stage.js';
import Component from '../models/Component.js';
import Team from '../models/Team.js';
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';

await connectDB();

// --- Stages ---
await Stage.deleteMany({});
await Stage.insertMany([
  {
    stageNumber: 1,
    title: 'Stage 1 - The First Signal',
    message: 'Your cryptic clue text for stage 1 goes here.',
    correctAnswer: 'answer1',
    coinsReward: 150,
    hints: [
      { text: 'Hint 1 for stage 1', cost: 50 },
      { text: 'Hint 2 for stage 1', cost: 75 },
    ],
  },
  {
    stageNumber: 2,
    title: 'Stage 2 - The Broken Terminal',
    message: 'Your cryptic clue text for stage 2 goes here.',
    correctAnswer: 'answer2',
    coinsReward: 175,
    hints: [
      { text: 'Hint 1 for stage 2', cost: 50 },
      { text: 'Hint 2 for stage 2', cost: 75 },
    ],
  },
  {
    stageNumber: 3,
    title: 'Stage 3 - The Abandoned Lab',
    message: 'Your cryptic clue text for stage 3 goes here.',
    correctAnswer: 'answer3',
    coinsReward: 200,
    hints: [
      { text: 'Hint 1 for stage 3', cost: 50 },
      { text: 'Hint 2 for stage 3', cost: 75 },
    ],
  },
  {
    stageNumber: 4,
    title: 'Stage 4 - Find the Contact',
    message: 'Volunteer description clue goes here.',
    correctAnswer: 'volunteer_name_4',
    coinsReward: 225,
    hints: [
      { text: 'Hint 1 for stage 4', cost: 50 },
    ],
  },
  {
    stageNumber: 5,
    title: 'Stage 5 - The Final Node',
    message: 'Volunteer description clue goes here.',
    correctAnswer: 'volunteer_name_5',
    coinsReward: 250,
    hints: [
      { text: 'Hint 1 for stage 5', cost: 75 },
    ],
  },
]);

// --- Components ---
await Component.deleteMany({});
await Component.insertMany([
  { name: 'Basic Sensor', cyberpunkName: 'Signal Tap Module', price: 150, stock: 12 },
  { name: 'Supporting Module', cyberpunkName: 'Neural Bridge Unit', price: 200, stock: 12 },
  { name: 'Processing Unit', cyberpunkName: 'Cortex Relay', price: 250, stock: 12 },
  { name: 'ESP8266 - Core MCU', cyberpunkName: 'Neural Core Alpha', price: 300, stock: 12 },
]);

// --- Teams ---
await Team.deleteMany({});
await Team.insertMany([
  { teamCode: 'TEAM01', teamName: 'Circuit Breakers', members: ['Member 1', 'Member 2', 'Member 3', 'Member 4', 'Member 5'] },
  { teamCode: 'TEAM02', teamName: 'Null Pointers', members: ['Member 1', 'Member 2', 'Member 3', 'Member 4', 'Member 5'] },
  // Add all 12 teams here
]);

// --- Admin ---
await Admin.deleteMany({});
const hashed = await bcrypt.hash('admin123', 10);
await Admin.create({ username: 'admin', password: hashed, role: 'admin' });

console.log('Seed complete');
process.exit(0);
```

Run it with:
```bash
node --experimental-vm-modules lib/seed.js
```

Or add a `/api/seed` route temporarily and hit it once (delete after use).

---

## Done when:
- [ ] All 6 model files created in /models/
- [ ] Seed script created in /lib/seed.js
- [ ] Database seeded - check MongoDB Atlas to confirm collections exist
- [ ] Stage, Component, Team, Admin documents visible in Atlas

---

## Next task: README-03-auth.md
