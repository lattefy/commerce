# Lattefy — Project Bible

## What is this
Two-sided platform. Customer side: browse stores (restaurants/cafes), place orders (delivery/takeaway), earn loyalty points. B2B side: store owners manage their shop, employees handle orders, analytics. Built as an alternative to high-commission platforms like PedidosYa/Rappi.

## Repo structure
Monorepo: /backend (NestJS) + /frontend (Next.js)

## Stack
### Backend
- NestJS 11, TypeScript
- Prisma 7.4 + PostgreSQL (Supabase + pgBouncer)
- JWT auth via Supabase JWKS
- Local: http://localhost:3001
- Deploy: Render → https://lattefy-backend.onrender.com

### Frontend
- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4, shadcn/ui
- Local: http://localhost:3000
- Deploy: Vercel → https://commerce-zeta-five-23.vercel.app

### Services
- Auth: Supabase Auth (JWT/JWKS)
- Payments: Mercado Pago OAuth — Checkout Pro, each store connects its own MP account
- Images: Cloudinary (cloud: djassgqhi, preset: lattefy_uploads, folder: lattefy/)
- Domain: lattefy.com.uy (registered at Antel, Uruguay)

## Backend modules (all complete: M1–M6)
- Auth: Supabase JWKS validation, AuthGuard
- Me: GET/PATCH profile, post-login role-based redirect
- Stores: CRUD, memberships with granular permissions
- Orders: create, list, change status, confirm-payment
- Loyalty: LoyaltyLedger, Rewards
- Payment: MP OAuth connect, create preference, webhook, confirm-payment
- Addresses: CRUD for user addresses

## Users & roles
Four roles: customer, employee, owner, admin
One login endpoint. Role determines where user lands after auth.

## Routing architecture (decided, not yet implemented)
- / → customer platform (browse stores, orders, loyalty, account)
- /dashboard → B2B side (owner customizes store, employees handle orders)
- /admin → admin panel (platform metrics, store approvals, user management)
- Auth pages: /login, /register (customer-facing) + redirect ?next= param for dashboard access
- Protection: middleware.ts reads JWT role claim, enforces per-segment access
- Google Sign-In via Supabase: enabled for all roles

## Pending frontend work
- [ ] Auth routing system (middleware.ts role-based redirects)
- [ ] Google Sign-In integration (Supabase OAuth, all roles)
- [ ] Customer platform: Cart redesign, /stores/[slug]/checkout, post-payment confirmation
- [ ] CustomerAddress model integration
- [ ] Storefront customer auth flow
- [ ] Dashboard orders page: search bar, filters, more order detail on pending
- [ ] Admin dashboard: platform metrics, not just store approvals
- [ ] Design: polish & consistency across both sides (not a full redesign)
- [ ] UI polish: pickupTime/deliveryTime settings, Lucide icon replacements in StoreHero

## Infrastructure
- Frontend: Vercel (free tier, cold starts expected)
- Backend: Render (free tier, cold starts expected)
- DB: Supabase (free tier)
- Considering Railway for both frontend+backend post-validation
- Goal: validate market fit before spending on infra

## Key conventions (read the code to confirm these before assuming)
- Before making any change, read the relevant files first
- Never modify prisma/schema.prisma without checking existing relations
- Always check if a shadcn component already exists before creating custom UI
- Backend responses follow existing pattern in each module — check controller before adding endpoints
- All new frontend pages go under App Router conventions (no pages/ directory)

## How to start a session
1. Run: find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.next/*" | head -60
2. Read CLAUDE.md (this file)
3. Read backend/prisma/schema.prisma for data model
4. Then read the specific files relevant to the task
5. Ask clarifying questions before writing code if anything is ambiguous

## Owner
Juani — Uruguay. Building Lattefy 2.0.
