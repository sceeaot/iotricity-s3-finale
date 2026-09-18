# TASK 03 - Authentication

## What you are doing
Team login with team code. Admin login with username + password.
Sessions using cookies. No NextAuth - keep it simple with custom JWT or
iron-session. We use a simple cookie-based approach here.

---

## Install one more package

```bash
npm install iron-session
```

---

## File: lib/session.js

```js
export const sessionOptions = {
  password: process.env.NEXTAUTH_SECRET,
  cookieName: 'iotricity_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};
```

---

## File: lib/getSession.js

```js
import { getIronSession } from 'iron-session';
import { sessionOptions } from './session';
import { cookies } from 'next/headers';

export async function getSession() {
  const session = await getIronSession(await cookies(), sessionOptions);
  return session;
}
```

---

## API: app/api/auth/team-login/route.js

```js
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

export async function POST(req) {
  const { teamCode } = await req.json();

  await connectDB();
  const team = await Team.findOne({ teamCode: teamCode.trim().toUpperCase() });

  if (!team) {
    return Response.json({ error: 'Invalid team code' }, { status: 401 });
  }

  const session = await getIronSession(await cookies(), sessionOptions);
  session.user = {
    id: team._id.toString(),
    teamName: team.teamName,
    role: 'team',
  };
  await session.save();

  return Response.json({ success: true, teamName: team.teamName });
}
```

---

## API: app/api/auth/admin-login/route.js

```js
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import bcrypt from 'bcryptjs';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

export async function POST(req) {
  const { username, password } = await req.json();

  await connectDB();
  const admin = await Admin.findOne({ username });

  if (!admin) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const session = await getIronSession(await cookies(), sessionOptions);
  session.user = {
    id: admin._id.toString(),
    username: admin.username,
    role: admin.role,
  };
  await session.save();

  return Response.json({ success: true, role: admin.role });
}
```

---

## API: app/api/auth/logout/route.js

```js
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

export async function POST() {
  const session = await getIronSession(await cookies(), sessionOptions);
  session.destroy();
  return Response.json({ success: true });
}
```

---

## Page: app/(team)/login/page.js

```js
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TeamLogin() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/team-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamCode: code }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div style={{ padding: '60px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>IoTRICITY S3</h1>
      <p style={{ color: '#888', marginBottom: '32px' }}>Team Login</p>

      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          Team Code
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter your team code"
          required
          style={{ marginBottom: '16px' }}
        />
        {error && (
          <p style={{ color: '#ff4444', marginBottom: '12px' }}>{error}</p>
        )}
        <button type="submit" style={{ width: '100%' }}>
          Enter
        </button>
      </form>

      <br />
      <a href="/admin/login" style={{ color: '#555', fontSize: '12px' }}>
        Admin login
      </a>
    </div>
  );
}
```

---

## Page: app/(admin)/admin/login/page.js

```js
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push('/admin/dashboard');
  }

  return (
    <div style={{ padding: '60px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Admin Login</h1>
      <p style={{ color: '#888', marginBottom: '32px' }}>IoTRICITY S3 - Organizer Access</p>

      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: '8px' }}>Username</label>
        <input
          type="text"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="Username"
          required
          style={{ marginBottom: '16px' }}
        />
        <label style={{ display: 'block', marginBottom: '8px' }}>Password</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Password"
          required
          style={{ marginBottom: '16px' }}
        />
        {error && (
          <p style={{ color: '#ff4444', marginBottom: '12px' }}>{error}</p>
        )}
        <button type="submit" style={{ width: '100%' }}>
          Login
        </button>
      </form>
    </div>
  );
}
```

---

## Helper: lib/requireAuth.js

Use this inside API routes to protect them:

```js
import { getSession } from './getSession';

export async function requireTeam() {
  const session = await getSession();
  if (!session?.user || session.user.role !== 'team') {
    return { error: 'Unauthorized', status: 401 };
  }
  return { user: session.user };
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session?.user || session.user.role !== 'admin') {
    return { error: 'Unauthorized', status: 401 };
  }
  return { user: session.user };
}
```

Usage in any API route:
```js
const auth = await requireTeam();
if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
const { user } = auth;
```

---

## Done when:
- [ ] Team login page works at /login
- [ ] Admin login page works at /admin/login
- [ ] Correct team code logs in and redirects to /dashboard
- [ ] Wrong code shows error message
- [ ] Admin login works with seeded credentials
- [ ] Session persists on page refresh (check browser cookies)

---

## Next task: README-04-stage-system.md
