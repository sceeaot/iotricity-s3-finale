# TASK 01 - Project Setup

## What you are building
IoTRICITY Season 3 event webapp. Next.js full stack, MongoDB database.
Black background, white text, default Next.js styling only. No UI libraries.

## Checkpoint note
Some checkpoints in the event flow are intentionally hidden behind a QR code. When a team reaches one of these checkpoints, they must scan the QR code first to reveal that checkpoint's problem statement before continuing.

---

## Step 1 - Create Next.js project

```bash
npx create-next-app@latest iotricity-s3
```

When prompted:
- TypeScript: No
- ESLint: Yes
- Tailwind: No
- src/ directory: No
- App Router: Yes
- Import alias: No

```bash
cd iotricity-s3
```

---

## Step 2 - Install dependencies

```bash
npm install mongoose next-auth bcryptjs socket.io socket.io-client
```

---

## Step 3 - Create folder structure

Create these folders and empty files manually or run the commands below:

```bash
mkdir -p lib models app/\(team\)/dashboard app/\(team\)/shop app/\(team\)/receipt/\[id\] app/\(team\)/login app/\(admin\)/admin/dashboard app/\(admin\)/admin/dispatch app/\(admin\)/admin/team/\[id\] app/\(admin\)/admin/login app/api/auth/team-login app/api/auth/admin-login app/api/stage/current app/api/stage/submit app/api/stage/hint app/api/shop/components app/api/shop/buy app/api/shop/receipt/\[id\] app/api/admin/leaderboard app/api/admin/team/\[id\] app/api/admin/override app/api/admin/dispatch
```

---

## Step 4 - Environment variables

Create `.env.local` in root:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/iotricity
NEXTAUTH_SECRET=some_random_long_string_here
NEXTAUTH_URL=http://localhost:3000
ADMIN_SECRET=admin_password_here
```

Replace `<username>` and `<password>` with your MongoDB Atlas credentials.

---

## Step 5 - MongoDB connection file

Create `lib/mongodb.js`:

```js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI not defined in .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
```

---

## Step 6 - Global styles

In `app/globals.css`, replace everything with:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: #000;
  color: #fff;
  font-family: monospace;
  min-height: 100vh;
}

input, textarea, select {
  background-color: #111;
  color: #fff;
  border: 1px solid #333;
  padding: 8px 12px;
  font-family: monospace;
  font-size: 14px;
  width: 100%;
}

button {
  background-color: #fff;
  color: #000;
  border: none;
  padding: 8px 16px;
  cursor: pointer;
  font-family: monospace;
  font-size: 14px;
}

button:hover {
  background-color: #ccc;
}

button.danger {
  background-color: #ff4444;
  color: #fff;
}

a {
  color: #fff;
  text-decoration: underline;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #333;
  padding: 8px 12px;
  text-align: left;
}

th {
  background-color: #111;
}
```

---

## Step 7 - Root layout

In `app/layout.js`:

```js
import './globals.css';

export const metadata = {
  title: 'IoTRICITY Season 3',
  description: 'EE Students Chapter - Academy of Technology',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

---

## Step 8 - Root page (temporary)

In `app/page.js`:

```js
export default function Home() {
  return (
    <div style={{ padding: '40px' }}>
      <h1>IoTRICITY Season 3</h1>
      <p>EE Students Chapter - Academy of Technology</p>
      <br />
      <a href="/login">Team Login</a>
      <br />
      <a href="/admin/login">Admin Login</a>
    </div>
  );
}
```

---

## Step 9 - Test it

```bash
npm run dev
```

Open `http://localhost:3000` - you should see the home page with black background and white text.

---

## Done when:
- [ ] App runs on localhost:3000
- [ ] Black background, white monospace text shows
- [ ] No errors in terminal
- [ ] .env.local created with correct values
- [ ] MongoDB connection file exists

---

## Next task: README-02-models.md
