# DEATHCLOCK — Carbon Intelligence Bureau
### PromptWars Challenge 3 | Hack2Skill Virtual: PromptWars

> *Your city has a carbon budget. It's running out. You're burning it every day. This is how much.*

**Live Demo:** https://deathclock-nine.vercel.app  
**Built with:** Next.js · Gemini API · Google Antigravity IDE · Framer Motion · Canvas API

---

## Chosen Vertical

**Individual Carbon Footprint Tracker** — helping individuals understand, track, and reduce their personal carbon footprint through real-time city-level data and personalized behavioral interventions.

---

## The Problem Being Solved

Every existing carbon footprint tool shows users a number — "your footprint is 4.2 tonnes CO₂ per year" — and expects that number to drive behavior change. It doesn't. People don't feel the urgency of an abstract statistic.

DeathClock reframes the problem: instead of showing you a number, it shows you a **deadline**. Your city has a specific, calculable carbon budget before it crosses the 1.5°C irreversible climate threshold. That budget is being consumed right now, every second. And you personally are contributing to burning it faster.

The shift from "here is your data" to "here is your deadline" is the core behavioral insight driving this application.

---

## How It Works

### Flow Overview

```
Landing (Classified Dossier)
    ↓ User enters city name
Scanning Page (Radar + Data Reveal)
    ↓ Gemini API fetches city carbon data
Dossier (5 tabs)
    ├── DOSSIER    — City carbon intelligence file
    ├── EVIDENCE   — Emission category breakdown
    ├── TIMELINE   — Live ticking death countdown
    ├── AUDIT      — 18-question personal lifestyle assessment
    └── VERDICT    — Personalized missions + commitment system
```

### Page 1 — Landing (Classified Document)
The UI is designed as a leaked government intelligence document — the Climate Intelligence Bureau's classified carbon countdown file. Users enter their city name and click RETRIEVE to begin.

### Page 2 — Scanning
A radar sweep animation plays while Gemini API processes the city. Classified data fields unlock one by one — redacted bars revealing real carbon data in real time. This loading state is intentionally dramatic to create emotional investment before the data lands.

### Page 3 — Dossier (5 Tabs)

**DOSSIER tab:** City-specific carbon intelligence — remaining budget, survival probability, annual emissions, threat classification, and a Gemini-generated field intelligence summary specific to that city's climate risks.

**EVIDENCE tab:** Category-level emission breakdown (Transport, Energy, Industry, Waste, Agriculture, Buildings) with animated bars showing relative contribution.

**TIMELINE tab:** The live death clock — a real-time countdown showing exactly how long the city's carbon budget has remaining before irreversible threshold breach. This is the emotional core of the product. The clock ticks every second.

**AUDIT tab:** An 18-question personal lifestyle assessment across 6 categories:
- Movement (commute, vehicle, flights, deliveries)
- Food (meat consumption, sourcing, waste)
- Home (AC usage, electricity, renewables)
- Consumption (fashion, electronics, streaming)
- Water & Waste (showers, segregation, plastics)
- Work (remote vs office, video calls, building type)

Each answer instantly updates the user's personal burn rate — showing exactly how many seconds per day their lifestyle burns off the city's clock.

**VERDICT tab:** After completing the audit, Gemini API generates 3 personalized behavior swap missions based on the user's specific answers and city. Each mission shows:
- The specific action to take
- Exact seconds restored to the city clock per day
- Difficulty level
- City-specific local context (e.g. local transit options, nearby markets)

Users commit to missions. A share card is generated for social broadcast.

---

## Technical Approach

### AI Integration
- **Gemini API** (`/api/carbon`) — generates city-specific carbon budget data, survival probability, field intelligence summary, and contextual threat analysis
- **Gemini API** (`/api/swaps`) — receives all 18 audit answers + total burn rate, generates 3 personalized behavioral interventions with city-specific context
- Questions are served from a local hardcoded bank (`lib/questions.ts`) for speed and reliability — no API latency in the audit flow
- Only 2 Gemini API calls total per user session for efficiency

### Architecture
```
app/
├── page.tsx              — Landing dossier page
├── scanning/page.tsx     — Radar + data reveal sequence
├── dossier/page.tsx      — 5-tab dossier experience
├── audit/[city]/page.tsx — 18-question lifestyle audit
api/
├── carbon/route.ts       — Gemini city carbon data
├── swaps/route.ts        — Gemini personalized missions
lib/
├── questions.ts          — Complete hardcoded question bank
components/
├── Cursor.tsx            — Custom crosshair cursor
├── PageSwitcher.tsx      — Bottom navigation pill
├── Radar.tsx             — Canvas radar sweep animation
├── DeathClock.tsx        — Live countdown component
└── ShareCard.tsx         — Canvas share card generator
```

### Key Technical Decisions
- **No globe/map** — deliberately avoided the overused approach of every other climate app. Radar scanner is more dramatic and more original.
- **Hardcoded questions, AI-generated insights** — questions are static for speed; Gemini is only called where personalisation is genuinely needed (city data + final swap recommendations)
- **localStorage session** — city name, carbon data, all answers, burn rate, and committed missions persist across the session without a database
- **Canvas share card** — generated client-side, no server dependency for social sharing

---

## Assumptions Made

1. Carbon budget data is estimated by Gemini based on IPCC regional data — directionally accurate, not live satellite data
2. Personal burn rate calculations use established carbon accounting factors (IPCC emission factors per activity type) hardcoded into the question bank
3. "Survival probability" is a simplified metric representing the probability of staying below 1.5°C given current trajectory — not a formal scientific probability
4. City-level data covers major global cities and all Indian states — smaller cities fallback to regional estimates

---

## Setup & Running Locally

```bash
# Clone the repository
git clone https://github.com/[your-username]/deathclock

# Install dependencies
cd deathclock
npm install

# Create environment file
cp .env.example .env.local
# Add your Gemini API key to .env.local:
# GEMINI_API_KEY=your_key_here
# Get key free at: https://aistudio.google.com

# Run development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables Required
```
GEMINI_API_KEY=your_gemini_api_key_here
```

Get a free API key at [Google AI Studio](https://aistudio.google.com)

---

## Testing the Application

### Full User Flow Test
1. Navigate to `/` — verify landing page loads, countdown ticks, ticker scrolls
2. Enter "Mumbai" in the city field → click RETRIEVE
3. Verify scanning page: radar sweeps, 9 data lines reveal sequentially
4. After ~5 seconds, verify automatic navigation to `/dossier`
5. Click through all 5 sidebar tabs — verify each loads correctly
6. In AUDIT tab: answer all 18 questions, verify burn rate updates after each
7. After Q18: verify loading state, then VERDICT tab opens automatically
8. In VERDICT: commit to a mission, verify committed state and animation
9. Click BROADCAST — verify share card generates

### Known Limitations
- City data accuracy depends on Gemini API response quality
- If Gemini API is unavailable, fallback values are used
- Mobile layout optimised for 375px and above

---

## Challenge Alignment

| Criterion | How DeathClock Addresses It |
|---|---|
| Understand carbon footprint | City-level carbon budget data, field intelligence, emission evidence by category |
| Track carbon footprint | 18-question personal audit calculates individual burn rate in real-time |
| Reduce carbon footprint | 3 AI-personalized behavior swap missions with local context and commitment mechanic |
| Smart dynamic assistant | Gemini generates city-specific intelligence + personalized missions from audit answers |
| Logical decision making | Burn rate calculated from IPCC emission factors; missions ranked by impact |
| Real-world usability | Works for 195 countries + all Indian states; mobile responsive |

---

## Built With

- [Next.js 14](https://nextjs.org/) — App Router, TypeScript
- [Google Gemini API](https://ai.google.dev/) — Carbon intelligence + personalized missions
- [Google Antigravity IDE](https://antigravity.google/) — AI-assisted development
- [Framer Motion](https://www.framer.com/motion/) — Animations and transitions
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) — Radar, city skyline, share card
- [IBM Plex Mono / IBM Plex Sans](https://fonts.google.com/specimen/IBM+Plex+Mono) — Typography

---

## Author

**Vaibhav A Jain**  
Built for Hack2Skill Virtual: PromptWars — Challenge 3  
June 2026