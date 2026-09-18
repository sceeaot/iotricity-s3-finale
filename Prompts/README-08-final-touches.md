# TASK 08 - Final Touches and Deployment

## What you are doing
Protecting routes, fixing edge cases, deploying to Vercel.

---

## 1. Middleware - protect routes

Create `middleware.js` in the root of the project:

```js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('iotricity_session');

  // Admin routes
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Team routes
  const teamRoutes = ['/dashboard', '/shop', '/receipt', '/leaderboard'];
  if (teamRoutes.some((r) => pathname.startsWith(r))) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/shop/:path*', '/receipt/:path*', '/leaderboard/:path*', '/admin/:path*'],
};
```

---

## 2. Add team start time on first dashboard load

In `app/api/stage/current/route.js`, add this after finding the team:

```js
// Set start time when team first loads dashboard
if (!team.startTime) {
  await Team.updateOne({ _id: team._id }, {
    startTime: new Date(),
    status: 'active'
  });
}
```

---

## 3. Useful admin util - reset a team (for testing)

Add to `app/api/admin/reset/route.js` (remove before production):

```js
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import TeamStageState from '@/models/TeamStageState';
import Transaction from '@/models/Transaction';
import Purchase from '@/models/Purchase';
import { requireAdmin } from '@/lib/requireAuth';

export async function POST(req) {
  const auth = await requireAdmin();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const { teamId } = await req.json();

  await connectDB();
  await Team.updateOne({ _id: teamId }, {
    coins: 0, currentStage: 1, completedStages: [],
    startTime: null, status: 'waiting'
  });
  await TeamStageState.deleteMany({ teamId });
  await Transaction.deleteMany({ teamId });
  await Purchase.deleteMany({ teamId });

  return Response.json({ success: true });
}
```

---

## 4. Edge cases to handle

**Team completes all stages but still has pending components:**
- Shop stays open after all stages complete
- Dashboard shows "All stages complete - go to shop" message
- This is already handled in dashboard page.js

**Team tries to buy same component twice:**
- API returns error "Already purchased"
- Shop page greys out purchased items
- Already handled

**Admin dispatch marking wrong receipt:**
- Receipt ID is unique and generated per purchase
- Admin must see receipt physically from team before clicking dispatch
- Add a confirmation dialog in dispatch page:

```js
async function handleDispatch(receiptId, teamName, componentName) {
  const confirmed = confirm(
    `Confirm dispatch:\nTeam: ${teamName}\nComponent: ${componentName}\nReceipt: ${receiptId}`
  );
  if (!confirmed) return;
  // rest of dispatch logic
}
```

---

## 5. Environment variables for production

In Vercel dashboard, add these environment variables:

```
MONGODB_URI = your atlas connection string
NEXTAUTH_SECRET = long random string (generate at randomkeygen.com)
NEXTAUTH_URL = https://your-vercel-url.vercel.app
```

---

## 6. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Follow the prompts. Vercel auto-detects Next.js.

Or connect your GitHub repo to Vercel for auto-deploy on push.

---

## 7. Pre-event checklist

Before the finale day:

- [ ] All 12 team codes seeded in DB (TEAM01 to TEAM12)
- [ ] All 5 stage answers set correctly in DB
- [ ] All stage messages and clues written in DB
- [ ] All 4 components seeded with correct prices
- [ ] Admin account created and password working
- [ ] App deployed and URL shared with teams
- [ ] Test full flow with one dummy team - login, solve stages, buy component, view receipt
- [ ] Test admin dispatch flow - buy component, go to dispatch, mark dispatched, check receipt updates
- [ ] Leaderboard tested with 2-3 dummy teams
- [ ] Physical components counted and ready at dispatch desk
- [ ] Volunteer briefed for CP4 and CP5

---

## 8. On the day - admin operations

**Start the event:**
- Open /admin/dashboard on a laptop at the organizer desk
- Keep /admin/dispatch open on a second tab or device at the dispatch desk
- Teams login on their own phones/laptops

**During the event:**
- Dispatch desk watches /admin/dispatch for new pending receipts
- When a team brings a printed/shown receipt, verify receipt ID matches, click dispatch, hand over component
- Admin watches leaderboard for any stuck teams - use override if genuinely needed

**End of event:**
- Check all team submissions
- Score builds manually
- Announce results

---

## Full app page map

```
/                       Home - links to team and admin login
/login                  Team login
/dashboard              Team - stage system
/shop                   Team - component store
/receipt/[id]           Team - purchase receipt
/leaderboard            Team - live rankings

/admin/login            Admin login
/admin/dashboard        Admin - leaderboard + team panels
/admin/dispatch         Admin - dispatch queue
```

---

## Done when:
- [ ] Middleware redirects unauthenticated users correctly
- [ ] Start time recorded when team first loads dashboard
- [ ] Dispatch confirmation dialog added
- [ ] App deployed on Vercel
- [ ] All environment variables set in Vercel
- [ ] Full end-to-end test passed on production URL
- [ ] Pre-event checklist completed
