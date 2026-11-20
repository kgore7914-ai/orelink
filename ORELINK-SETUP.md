# OreLink — Next.js version (Zip 1: foundation)

A complete Next.js project. Keep your `.env.local` and the hidden `.git` folder.

## What's inside

```
app/            one folder per page (welcome, signin, join, me, events, ...)
components/     header, price tape, bottom bar, menu, tour, gatekeeper
components/screens/   the screens themselves
context/        who is signed in, their profile and verification
lib/            Supabase connection, artwork, lists, helpers
styles/orelink.css    the prototype's design (do not edit casually)
public/         logo and photos from the prototype
supabase/01_schema.sql   the database (you already ran this)
```

## Install

1. Copy everything from this zip into your project folder (choose **Replace** if asked).
2. In the terminal:
   ```
   pnpm install
   pnpm dev
   ```
4. Open **http://localhost:3000**.

## Your keys

Nothing to change. `.env.local` should have:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...        (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...)
```
Either key name works.

## One Supabase setting

**Authentication → URL Configuration → Site URL**: `http://localhost:3000`

## Make yourself admin (after you sign up)

Supabase → SQL Editor:
```sql
insert into public.admins (user_id)
select id from auth.users where email = 'you@example.com';
```

## Save to GitHub

```
git add -A
git commit -m "OreLink foundation (zip 1)"
git push
```

## Test checklist

- [ ] Welcome animation plays
- [ ] Create a profile → code arrives by email → About you → Create my profile
- [ ] Tour, then home screen with prices ticker
- [ ] Menu, profile, Save profile, Light / Dark
- [ ] Sign out → Sign in again
