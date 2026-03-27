# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, TailwindCSS, React Query, react-hook-form, wouter

## Application: KathArtsis Manager

A management web app with 5 modules:
1. **Dashboard** - Overview with summary cards (income, expense, balance, receipts, stickers, certs)
2. **Finance** - Income/Expense transaction ledger with CRUD
3. **Receipts** - Donation receipt generator (auto receipt# in #000001 format)
4. **Stickers** - Award sticker generator (1st/2nd/3rd place)
5. **Certificates** - Award certificate generator
6. **Account Statement** - Income & Expenditure report

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── katharsis-manager/  # React + Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

Tables:
- `transactions` — date, type (income/expense), category, name, amount, payment_method, notes
- `receipts` — receipt_number (#000001), donor_name, amount, payment_method
- `stickers` — program_name, position (1st/2nd/3rd), name
- `certificates` — name, program_name, position

## API Routes (all under /api)

- `GET/POST /api/finance/transactions`
- `DELETE /api/finance/transactions/:id`
- `GET /api/finance/summary`
- `GET/POST /api/receipts`
- `GET/POST /api/stickers`
- `DELETE /api/stickers/:id`
- `GET/POST /api/certificates`
- `DELETE /api/certificates/:id`

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
- `pnpm --filter @workspace/api-spec run codegen` — regenerates API client and Zod schemas
- `pnpm --filter @workspace/db run push` — pushes DB schema changes
