TRADEQUEST — PHASE 4 LAUNCH BUILD

WHAT PHASE 4 DOES
• Packages TradeQuest as a deployable Node web service.
• Adds a cloud-auth adapter for Supabase while preserving free local demo mode.
• Adds production security headers and a service-health endpoint.
• Keeps Stripe subscription and AI Coach server-side so secret keys never belong in browser code.
• Adds Stripe webhook endpoint scaffolding.
• Adds launch-draft Terms, Privacy and Trading/Educational Disclosures.
• Adds Render/Procfile deployment configuration.
• Keeps all trading simulated.

WHAT IS STILL REQUIRED BEFORE REAL CUSTOMERS
1. Create/choose a hosting account and deploy this folder.
2. Create a Supabase project; run supabase-schema.sql; add URL/anon/service-role environment variables.
3. Finish wiring the existing login UI to cloudSignUp/cloudSignIn and migrate local game progress after first cloud login.
4. Create Stripe product/price and webhook. Add authenticated user ID as Stripe checkout metadata and implement verified subscription->profile mapping.
5. Select and license a market-data provider; label quotes real-time/delayed as required.
6. Add rate limiting, monitoring, email verification, password reset UI, account deletion, support/contact workflow, backups and analytics.
7. Have counsel review legal pages, especially if minors may use the service.
8. Test billing/auth in staging before enabling public paid signup.

LOCAL RUN
npm install
Copy .env.example -> .env
npm run dev
Open http://localhost:3000

ZERO-COST DEMO
The local-storage game still works without service credentials. Do not call fictional simulator prices live market data.

DEPLOYMENT
This folder includes render.yaml and a Procfile. It can also run on other Node-compatible hosts.
Never commit .env or secret keys.
