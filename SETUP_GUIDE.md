# Khelo Cash King — Setup Guide

## Part 1: Supabase Setup (5 minutes)

1. Go to https://supabase.com and sign up (free).
2. Click "New Project". Pick any name (e.g. "khelo-cash-king"), set a database password (save it somewhere), pick a region close to Bangladesh (Singapore is good).
3. Wait ~2 minutes for the project to finish setting up.
4. Once ready, go to **Project Settings → API** (left sidebar, gear icon → API).
   - Copy the **Project URL** (looks like `https://xxxxx.supabase.co`)
   - Copy the **anon public** key (long string under "Project API keys")
5. Open the `.env` file in this project folder and replace the placeholder values:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
6. Go to **SQL Editor** (left sidebar) → **New query**. Open `supabase_schema.sql` from this folder, copy ALL of it, paste into the SQL editor, and click **Run**. This creates all 6 database tables with proper security rules.
7. Go to **Authentication → Providers** (or Settings) and make sure **Email** provider is enabled (it is by default).
8. Go to **Authentication → Settings** (sometimes under "Sign In / Providers") and **turn OFF "Confirm email"** — since we use phone numbers (not real emails) for login, there's no inbox to confirm.

## Part 2: Run the App Locally

```bash
npm install
npm run dev
```

Open the URL shown (usually `http://localhost:5173`).

## Part 3: Make Yourself Admin

1. Sign up in the app with your phone number and a password.
2. Go to Supabase dashboard → **Authentication → Users**. Find your account, copy its **User UID**.
3. Go to **SQL Editor → New query**, run:
   ```sql
   insert into user_roles (user_id, role)
   values ('PASTE-YOUR-USER-UID-HERE', 'admin');
   ```
4. Log out and log back in inside the app. Go to Profile → you'll now see "Admin Panel".

## Part 4: Deploy for Free (so others can use it on their phones)

Easiest option: **Vercel** (free, no credit card needed)

1. Push this project folder to a GitHub repository (create one at github.com, then follow GitHub's instructions to push this folder).
2. Go to https://vercel.com, sign up with your GitHub account.
3. Click "Add New Project", select your repo.
4. In "Environment Variables", add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click Deploy. In ~1 minute you'll get a live URL like `khelo-cash-king.vercel.app`.
6. Share that URL — anyone can open it on their phone's browser.

## Part 5: Turning it into an APK (after deployment)

1. Go to https://www.pwabuilder.com
2. Paste your deployed Vercel URL.
3. It will analyze the site and let you download an Android package (APK/AAB).
4. Follow PWABuilder's packaging steps (it will guide you through Android-specific options).

---

## Project Structure

```
src/
  pages/           — Main screens (Play, Wallet, Profile, etc.)
  pages/admin/      — Admin panel screens
  components/       — Reusable UI pieces (TopBar, Countdown, modals)
  contexts/          — Auth state management
  lib/supabase.js  — Supabase connection
```

## What's Already Built

- Phone + password authentication with a sliding Sign In / Sign Up card (works on mobile too)
- Play page with 4 game modes (BR, Clash Squad, Lone Wolf, CS 1v1/2v2)
- Match list per mode with live countdown, room reveal logic, Join flow that asks for Free Fire IGN
- My Matches (upcoming + completed), Results, Top Players leaderboard, Rules page
- Wallet (deposit request form with bKash/Nagad), Withdraw — both pending admin approval
- Profile page with stats and edit screen
- Full Admin Panel: dashboard stats, create/edit/cancel matches, End Match flow (enter kills, mark winner, auto-distribute prizes), approve/reject deposits & withdrawals, user list with manual balance adjustment
- "Liquid glass" button and card styling throughout
