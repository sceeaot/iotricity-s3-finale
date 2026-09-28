# IoTRICITY Season 03 - Product Context

## Purpose

IoTRICITY is a live, in-person field challenge for the EE Students Chapter at the Academy of Technology. Teams solve electronics, IoT, and data-structure challenges, follow clues around the venue, earn Breach Credits (BC), and redeem those credits for physical hardware components. Organizers monitor team progress and verify component handoffs.

This document describes the product and the current implementation to support a UI redesign. The visual treatment can change freely; keep the roles, game rules, information, and page transitions below intact unless the product requirements are deliberately changed.

## Roles

- **Team participant:** Signs in with a team code, progresses through the five stages, may buy hints, checks rankings, and redeems components.
- **Organizer/admin:** Signs in separately, monitors teams, adjusts credits, resets a team's run, and marks purchased components as handed over.
- **Public visitor:** Can view the home page and live leaderboard without signing in.

Team and organizer sessions are separate role-based sessions. Team-only data and actions require team authentication; organizer controls require admin authentication.

## Page Map

Route groups in parentheses are Next.js organization only and do not appear in the URL.

| URL | Audience | Purpose and main elements |
| --- | --- | --- |
| `/` | Public | Event entry page. Identifies IoTRICITY Season 03 and the EE Students Chapter, describes the challenge, links to team sign-in and rankings, and provides organizer access. |
| `/login` | Team | Team-code sign-in. On success, creates a team session and routes to `/dashboard`; invalid codes show an inline error. |
| `/dashboard` | Team | Main field console. Shows current stage, five-stage progress, BC balance, stage title/instructions, the answer form, optional paid hints, and a link to the shop. At the end, shows a completion state and shop action. Header also links to the shop and disconnects the team. |
| `/shop` | Team | Component catalog with balance, component descriptions/prices, stock-available items, and purchase state. A team can redeem each component at most once. Successful purchase routes to its receipt. Links back to the console and rankings. |
| `/receipt/[id]` | Purchasing team | Purchase proof showing receipt ID, team, module, base component, price, purchase time, and dispatch status. The participant can print it and present it at the physical dispatch desk, or return to the shop. A receipt belongs only to the team that purchased it. |
| `/leaderboard` | Public | Live rankings with rank, team, completed stages, BC, and components redeemed. Refreshes automatically about every five seconds. Links to the team console and shop (those require team sign-in). |
| `/admin/login` | Organizer | Username/password sign-in. On success, routes to `/admin/dashboard`; invalid credentials show an error. |
| `/admin/dashboard` | Organizer | Live team status table plus selected-team detail. Shows rank, team, stages, credits, redeemed parts, and status. Team detail supports manual credit adjustment (with reason) and a destructive reset to zero progress. The list refreshes about every five seconds. Links to dispatch and disconnect. |
| `/admin/dispatch` | Organizer | Physical hardware handoff queue split into pending and dispatched purchases. Each pending row identifies the team, module, and receipt ID; organizer confirms and marks it dispatched. Queue refreshes about every five seconds. |

## Main Team Journey

1. A visitor enters at `/` and selects **Enter as Team**.
2. The team submits its issued team code at `/login`.
3. The first authenticated load of `/dashboard` starts the team's run timer/status and displays the current challenge.
4. The team submits an answer. A correct answer adds that stage's reward, records the completion, and advances the team to the next stage. An incorrect answer leaves the stage active and invites another attempt.
5. Teams may reveal optional hints for a stated BC cost. Revealed hints remain visible for that stage; hint costs are recorded as credit transactions.
6. After all five stages, the console shows mission completion. The shop is also available before completion.
7. At `/shop`, the team spends BC on available components. Each successful redemption creates a unique receipt and deducts the price.
8. The participant shows/prints the receipt at the physical dispatch desk. An organizer uses `/admin/dispatch` to verify and mark the handoff complete. The receipt then reports its dispatch status.
9. The public leaderboard reflects current team progress, remaining credits, and number of redeemed components.

## Organizer Journey

1. The organizer opens `/admin/login` and authenticates.
2. `/admin/dashboard` provides a live overview. Selecting a team opens its detail and redeemed-module status.
3. For event support, an organizer can add or subtract credits and provide a reason, or reset the team's run. Reset returns it to stage 1 with zero credits, clears stage state, purchase records, and transaction history, and sets its status to waiting.
4. At the hardware desk, `/admin/dispatch` lets the organizer confirm a pending receipt and mark it dispatched.

## Challenge and Credit Rules

The seed data defines five sequential stages. Reward values and sample challenge themes are:

| Stage | Theme in seed data | Reward |
| --- | --- | ---: |
| 1 - The Silent Watcher | MQTT publish/subscribe delivery count | 150 BC |
| 2 - The Outer Perimeter | MQTT `#` topic wildcard matching | 175 BC |
| 3 - The Eight-Bit Contact | Stack state and LIFO behavior | 200 BC |
| 4 - The Topic Mismatch | MQTT publish/subscribe topic mismatch | 225 BC |
| 5 - The Seven-Layer Key | Queue and FIFO ordering | 250 BC |

- A correct answer advances the team and awards that stage's BC once.
- Answer comparison ignores case and non-alphanumeric characters; configured aliases may also be accepted.
- Hints are optional, stage-specific, and deduct their listed BC cost when unlocked.
- BC is a spendable balance: it can be used for hints or component purchases.
- The seeded component catalog is: Signal Tap Module / Basic Sensor (150 BC), Neural Bridge Unit / Supporting Module (200 BC), Cortex Relay / Processing Unit (250 BC), and Neural Core Alpha / ESP8266 - Core MCU (300 BC).
- A team may purchase one of each component. Availability is limited by catalog stock. A purchase is not the same as dispatch: dispatch is a later organizer-confirmed physical handoff.
- Public ranking is currently ordered by credits descending, then current stage descending. The display also reports completed stages and components redeemed.

## Current Physical-Event Boundary and Caveats

Some gameplay depends on the physical venue, QR codes, and volunteers. The dashboard currently substitutes instructions for the puzzle text on stages 2-5: stages 2-3 say to scan a QR code at the location, while stages 4-5 say to ask a volunteer for the problem statement. The stage data still contains puzzle text and success messages, but those success messages are not currently shown in the dashboard UI.

There is currently no implemented scan page or scan API route in this repository. Treat QR scanning and the volunteer interaction as external event activities unless a future implementation adds in-app flows. Also, the physical clues in the seeded stage messages do not perfectly match the dashboard's stage-number-based QR/volunteer instructions; avoid presenting those as a fully consistent scripted flow without product confirmation.

## Data and System Overview

- **Framework:** Next.js App Router, React, and TypeScript for the UI; route handlers provide JSON APIs.
- **Database:** MongoDB via Mongoose.
- **Authentication:** Cookie-backed sessions via `iron-session`; team and admin roles are checked independently.
- **Core records:** `Team` (identity, credits, current/completed stages, run status), `Stage` (challenge copy, accepted answers, rewards, hints), `TeamStageState` (attempts, solution and revealed hints), `Component` (catalog, price, stock), `Purchase` (receipt and dispatch status), and `Transaction` (credit earn/spend/adjustment log). `Admin` stores organizer accounts.
- **Live refresh:** Leaderboard, organizer team list, and dispatch queue poll their APIs every five seconds.
- **Seed data:** `src/lib/seed.js` resets and populates stage, component, team, and admin collections for development. Do not treat seeded credentials or sample records as production configuration.

## UI Redesign Guidance

The current screens use a dark, technical, monospace visual style with cyan/acid highlights and orange warnings. That is an implementation choice, not a product constraint. A redesign may replace the palette, typography, layout, and component styling while retaining the information hierarchy and interactions described here.

Prioritize:

- Clear distinction between team-facing gameplay, public rankings, and organizer operations.
- Persistent visibility of team identity, current stage/progress, and BC balance during the team journey.
- A clear distinction between available, active, and completed stages; between locked and revealed hints; and between pending and dispatched purchases.
- Explicit feedback for loading, invalid credentials, wrong/correct answers, insufficient credits, already-purchased items, and completed runs.
- A usable small-screen experience for participants moving around a venue, and a scan-friendly, dense layout for organizers handling a live queue.
- Strong confirmation and clear consequences for credit adjustments, resets, purchases, and dispatch actions.

Do not imply that a team can dispatch its own purchase, that purchases automatically mean hardware has been handed over, or that an in-app QR scanner already exists.
