TRADEQUEST — PHASE 3

WHAT'S NEW
- Phase 3 Pro pricing/paywall screen ($14.99/mo UI)
- AI Coach interface with safe educational local fallback
- Production AI endpoint scaffold (server-side OpenAI key)
- Stripe subscription checkout endpoint scaffold
- Supabase production database schema with row-level security
- Health endpoint showing which production services are connected
- Phase 2 game loop remains usable at $0 with local storage
- Responsive UI additions for Coach and Pro

RUN FREE / DEMO MODE
Open index.html directly. Lessons, XP, achievements and the paper portfolio work locally.
The AI Coach uses built-in educational fallback answers and checkout never charges.

RUN PRODUCTION DEV SERVER
1. Install Node.js 20+
2. In this folder: npm install
3. Copy .env.example to .env and add only the services you want.
4. Run: npm run dev
5. Open http://localhost:3000

PRODUCTION CONNECTIONS
- Supabase: run supabase-schema.sql in your Supabase SQL editor, then add env keys.
- Stripe: create a recurring $14.99/month product/price, then add STRIPE_SECRET_KEY and STRIPE_PRICE_ID.
- AI Coach: add OPENAI_API_KEY server-side only. Never put secret keys in browser JavaScript.
- Market data: the simulator still uses fictional demo quotes. Connect a licensed market-data provider before calling prices live or delayed.

IMPORTANT
This package is production scaffolding, not a deployed service. Real auth migration, webhook handling for subscription status, rate limits, email verification, privacy/terms pages, logging, monitoring, and a licensed market-data feed should be completed before taking paying customers.
Trading remains simulated and educational; no brokerage execution is included.
