# Sidebar

A birthday gift PWA for my girlfriend — a cozy mini-game app that builds cognitive skills needed for psychometric testing (SHL/HireVue), disguised as casual, low-pressure games. She's a JD student at Melbourne Uni applying for law clerkships. Inspired by Focus Friend and Cats & Soup.

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- PWA via @serwist/next
- No backend, no auth, no database
- localStorage for all state (useLocalStorage hook in src/lib/hooks/)
- Hosted on Vercel, auto-deploys from GitHub

## Structure
- src/app/games/[game]/page.tsx — each game is a self-contained route
- src/components/ui/ — shared UI components
- src/components/layout/ — nav, back button, game chrome
- src/lib/constants.ts — game metadata (GAMES array)
- src/lib/storage.ts — localStorage wrapper
- src/lib/hooks/ — custom hooks

## Design tokens
Palette: bg #FFF8F2, surface #FFFFFF, primary #F4A261, secondary #A8D5BA, accent #C3A6D8, text #4A4A4A, text-light #8A8A8A, success #81C784, error #E57373
Font: Nunito (Google Fonts). Headings 600, body 400.
Border radius: 16px cards, 12px buttons, full-round icons.
Vibe: warm, cozy, friendly. Never clinical or test-like.

## Games
1. Pattern Garden — pattern recognition (in progress)
2. Verdict — deductive reasoning (planned)
3. Chart Check — numerical interpretation (planned)
4. Odd One Out — verbal/categorical reasoning (planned)

## Rules
- Mobile-first always. Max-width md, centered.
- No complex animations yet.
- No Supabase, no backend, no auth.
- Each game must be self-contained in its route folder.
- Keep localStorage simple — JSON get/set, no over-engineering.
- The app should never feel like test prep. Cozy and rewarding, not clinical.