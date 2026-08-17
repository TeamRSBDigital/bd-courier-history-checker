# CourierCheck BD

Production-oriented Bangladesh courier customer delivery-history checker designed for the primary delivery path:

**Local Development → GitHub Repository → Vercel Production**

The public application accepts a Bangladeshi mobile number, validates and normalizes it server-side, queries configured courier providers independently, aggregates semantically compatible delivery history, and presents a transparent delivery-risk indicator. Courier history is decision-support data only and is never presented as proof that a person committed fraud.

## Features

- Mobile-first public checker with loading, success, partial-success, no-data, rate-limit and provider-unavailable states.
- `POST /api/check` only; phone numbers are never placed in URLs.
- Server-side courier provider architecture with parallel lookups and provider failure isolation.
- Steadfast authorized fraud-check adapter with strict timeout and response validation.
- Pathao, RedX and CarryBee provider interfaces isolated behind explicit external documentation blockers; production never fabricates data.
- Bangladeshi number normalization for `17XXXXXXXX`, `017XXXXXXXX`, `88017XXXXXXXX` and `+88017XXXXXXXX`.
- Configurable, transparent risk thresholds.
- Vercel-compatible shared rate limiting through Upstash Redis REST; production fails closed if the shared limiter is missing.
- Privacy-first diagnostics: no full phone logging and no third-party analytics.
- Secure admin login using PBKDF2-SHA256 password hashing and HMAC-signed HttpOnly SameSite cookies.
- Authenticated admin diagnostics include application/provider configuration, aggregate search statistics, rate-limit statistics, provider latency and sanitized recent provider errors stored in Upstash when configured.
- Security headers, origin checks, body-size limits, strict JSON validation and safe public errors.
- Automated unit/API/security tests and GitHub Actions CI.
- No runtime npm dependencies.

## Architecture

```text
Browser
  ↓ POST /api/check
Vercel Function
  ├─ request/origin/body validation
  ├─ shared rate limit (Upstash REST)
  ├─ phone normalization
  └─ courier aggregator (Promise.allSettled)
       ├─ SteadfastProvider
       ├─ PathaoProvider
       ├─ RedxProvider
       └─ CarrybeeProvider
          ↓
      normalized courier results
          ↓
      transparent risk engine
          ↓
      masked JSON response
```

Static frontend files live in `public/` and are the only configured static output served by Vercel; API code lives in `/api`. Each API module exposes Vercel’s Web Handler `fetch(request)` entrypoint while keeping testable route functions isolated. Courier secrets are read only by server-side functions.

## Requirements

- Node.js 22.x for local tooling and the pinned Vercel runtime.
- A Vercel account for production deployment.
- Upstash Redis REST credentials for production rate limiting and aggregate metrics.
- Authorized courier merchant credentials/documentation for each provider you want enabled.

There is no required local database and no persistent local filesystem dependency.

## Local development

1. Copy the project.
2. Copy `.env.example` to `.env.local`.
3. Set `APP_URL=http://localhost:3000`.
4. For safe local UI/API testing set `MOCK_COURIERS=true`.
5. Run:

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run dev
```

Open `http://localhost:3000`.

`MOCK_COURIERS=true` is ignored as a production data source: the code refuses mock-provider behavior when `APP_ENV=production` or `VERCEL_ENV=production`.

## Validation commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm ci` installs the pinned TypeScript 5.8.3 development tool used by `npm run typecheck`. The production application itself has no npm runtime dependency.

## Environment variables

| Variable | Required / Optional | Purpose | Where to obtain it |
|---|---|---|---|
| `APP_URL` | Required in Production | Canonical application origin used for same-origin request validation | Your Vercel production/custom-domain URL |
| `APP_ENV` | Optional | Explicit environment label; Vercel can supply `VERCEL_ENV` | Set to `production` only for production |
| `PHONE_HMAC_SECRET` | Required in Production | Server-side keyed hashing for privacy-safe rate-limit identifiers | Generate a random 32+ byte secret |
| `UPSTASH_REDIS_REST_URL` | Required in Production | Shared serverless rate-limit and aggregate-metrics store | Upstash Redis console |
| `UPSTASH_REDIS_REST_TOKEN` | Required in Production | Auth token for the Redis REST endpoint | Upstash Redis console |
| `RATE_LIMIT_REQUESTS` | Optional | Public check limit per window | Choose an operational limit; default `20` |
| `RATE_LIMIT_WINDOW_SECONDS` | Optional | Public check rate-limit window | Default `60` |
| `ADMIN_USERNAME` | Required for Admin | Admin login username | Choose your own value |
| `ADMIN_PASSWORD_SALT` | Required for Admin | PBKDF2 salt | Generate with `scripts/hash-admin-password.mjs` |
| `ADMIN_PASSWORD_HASH` | Required for Admin | PBKDF2 password hash | Generate with `scripts/hash-admin-password.mjs` |
| `ADMIN_SESSION_SECRET` | Required for Admin/Production readiness | Signs the stateless admin session cookie | Generate a different random 32+ byte secret |
| `ADMIN_SESSION_TTL_SECONDS` | Optional | Admin session lifetime | Default `28800` seconds |
| `RISK_MIN_ORDERS` | Optional | Minimum compatible orders before assigning LOW/MODERATE/HIGH | Default `3` |
| `RISK_HIGH_MAX_SUCCESS_RATE` | Optional | Success-rate boundary below which risk is HIGH | Default `60` |
| `RISK_MODERATE_MAX_SUCCESS_RATE` | Optional | Success-rate boundary below which risk is MODERATE | Default `80` |
| `COURIER_TIMEOUT_MS` | Optional | Per-provider request timeout | Default `3500` ms |
| `STEADFAST_API_URL` | Optional until Steadfast enabled | Authorized Steadfast merchant API base URL | Steadfast merchant/API documentation |
| `STEADFAST_API_KEY` | Required for Steadfast | Merchant API key | Steadfast merchant API integration settings |
| `STEADFAST_SECRET_KEY` | Required for Steadfast | Merchant API secret | Steadfast merchant API integration settings |
| `PATHAO_API_URL` | External blocker | Reserved for authorized Pathao API base URL | Pathao Developer API / merchant-approved docs |
| `PATHAO_CLIENT_ID` | External blocker | Pathao merchant API credential | Pathao merchant panel Developer API |
| `PATHAO_CLIENT_SECRET` | External blocker | Pathao merchant API credential | Pathao merchant panel Developer API |
| `REDX_API_URL` | External blocker | Reserved for authorized RedX API base URL | RedX Developer API documentation |
| `REDX_API_KEY` | External blocker | RedX merchant API credential | RedX Developer API / merchant approval |
| `CARRYBEE_API_URL` | External blocker | Reserved for authorized CarryBee API base URL | CarryBee merchant-approved API documentation |
| `CARRYBEE_API_KEY` | External blocker | CarryBee merchant API credential | CarryBee merchant support/API approval |
| `MOCK_COURIERS` | Development/Test only | Enables deterministic non-production fixtures | Set `true` only in local/test environments |

Never commit real values. `.env*` is ignored except `.env.example`.

## Generate admin credentials

```bash
node scripts/hash-admin-password.mjs "use-a-long-unique-password"
```

Copy the printed `ADMIN_PASSWORD_SALT` and `ADMIN_PASSWORD_HASH` to the correct Vercel environment scope. Create `ADMIN_SESSION_SECRET` separately with a cryptographically random secret.

## Steadfast Setup

**Implementation:** present in `src/server/providers/steadfast.ts`.

The adapter uses server-side `Api-Key` and `Secret-Key` headers and the authorized fraud-check path under the configured Steadfast API base. Production verification still requires your valid merchant credentials and current Steadfast-provided documentation.

1. Obtain API integration credentials from your Steadfast merchant account/support.
2. Set `STEADFAST_API_URL`, `STEADFAST_API_KEY`, and `STEADFAST_SECRET_KEY` in Vercel Production.
3. Redeploy after changing environment variables.
4. Submit a known test customer number through the UI.
5. Confirm the provider card returns expected counts without exposing credentials or raw upstream payloads.

Common configuration errors: invalid/expired credentials, API access not enabled for the merchant, endpoint availability changing, or upstream rate limiting. The public UI shows only a safe unavailable message.

## Pathao Setup

Pathao publicly confirms that merchant integrations are available from the **Developer API** option in the merchant panel. The public material verified for this build did not expose a reliable customer delivery-history endpoint/response contract. Therefore production lookup code does **not** imitate merchant-panel login, scrape private dashboards, or invent an endpoint.

1. Obtain Pathao merchant Developer API access and customer-history documentation/approval.
2. Keep `PATHAO_CLIENT_ID` and `PATHAO_CLIENT_SECRET` server-side only.
3. Do not enable unofficial dashboard automation.
4. Real customer-history implementation remains an **external documentation blocker** until the authorized contract is available.

## RedX Setup

RedX provides an official Developer API for merchants. The public page verified for this build did not provide the customer-history response contract needed to implement the requested lookup safely.

1. Obtain RedX Developer API merchant approval and documentation for customer delivery history.
2. Set approved credentials only in Vercel server-side environment variables.
3. The provider remains safely unavailable until the authorized history contract is implemented and verified.

## CarryBee Setup

CarryBee has a merchant platform, but the public sources verified for this build did not provide an authorized customer-history API contract.

1. Request merchant API documentation/approval from CarryBee.
2. Obtain the required server-side credentials and customer-history endpoint contract.
3. Do not use credentials copied from public third-party code or scrape the merchant panel.
4. The provider remains safely unavailable until the authorized contract is supplied and verified.

## Add another courier

1. Implement `CourierProvider` from `src/server/types.ts`.
2. Keep authentication and response parsing inside the provider file.
3. Validate and normalize all upstream fields before returning `CourierHistory`.
4. Add the provider to `src/server/providers/index.ts`.
5. Add unit/integration fixtures and failure-isolation tests.
6. Never expose provider secrets or raw upstream responses to the browser.

# Deploy to Vercel

This repository is designed for a non-expert Git deployment flow.

1. Create a new GitHub repository and upload/push this project. Use `main` as the production branch.
2. Log in to Vercel.
3. Choose **Add New Project**.
4. Import the GitHub repository.
5. Keep the repository root as the Vercel Root Directory. Use **Framework Preset: Other**. This repository's `vercel.json` explicitly leaves **Build Command blank** and uses the standard dependency install behavior required by Vercel Functions; the configured **Output Directory is `public`**. Vercel serves only that static output plus the `/api/*.ts` Functions.
6. In **Settings → Environment Variables**, add the variables listed above. At minimum, production operation needs `APP_URL`, `PHONE_HMAC_SECRET`, Upstash REST credentials, and the admin auth values. Add each courier credential only to the environments where it is appropriate.
7. Set/confirm **Production Branch: `main`**.
8. Deploy.
9. Open the homepage and test `/api/check` through the UI with an authorized test number.
10. Optionally add a custom domain in Vercel and update `APP_URL` to that production origin, then redeploy.

No hardcoded localhost URL is used for production API calls; the browser calls same-origin `/api/*` routes.

## Recommended Vercel environment scopes

### Development

Use local `.env.local`. `MOCK_COURIERS=true` is allowed. Local in-memory rate limiting is permitted only outside production.

### Preview

Use separate Preview credentials. Do not assign Production courier secrets to Preview unless your organization explicitly intends that. Prefer a separate Upstash database/token for Preview when testing rate limiting.

### Production

Set `APP_URL` to the production origin, configure Upstash, admin secrets, and only authorized production courier credentials. Never set `MOCK_COURIERS=true`.

Vercel applies environment-variable changes to new deployments, so redeploy after changing secrets.

## Preview deployments

When Vercel Git integration is enabled, pull requests can receive normal Preview Deployments. The code uses same-origin browser API calls, so Preview URLs do not require source-code changes. Configure Preview environment variables separately in Vercel.

## GitHub Actions CI

`.github/workflows/ci.yml` runs on pushes and pull requests to `main`:

- reproducible `npm ci` from the committed lockfile (one pinned development dependency; no runtime dependencies),
- lint checks,
- TypeScript type-check,
- automated tests using explicit mocks,
- production repository build checks.

CI never requires real courier credentials.

## API behavior

### `POST /api/check`

Request:

```json
{ "phone": "017XXXXXXXX" }
```

Response contains only a masked phone number plus normalized summary/provider results. Sensitive responses use `Cache-Control: no-store`.

### `GET /api/health`

Returns a minimal liveness result without sensitive configuration.

### `GET /api/ready`

Production readiness validates the required deployment configuration internally and returns only `ready` / `not_ready`; individual configuration checks are not exposed publicly.

## Privacy

- Full searched numbers are not placed in URLs, titles, analytics events, browser console logs, or application logs.
- The public response contains a masked phone number.
- The repository contains no third-party analytics SDK.
- Rate-limit identifiers are keyed hashes rather than raw IP strings when stored externally.
- Aggregate metrics do not contain phone numbers.

## Security notes

Controls implemented include strict JSON content type/body size, server-authoritative phone validation, request origin checks, server-only secrets, HTTPS-only courier base enforcement for live Steadfast calls, strict timeouts, upstream response-size/schema checks, failure isolation, shared production rate limiting, HttpOnly/SameSite admin sessions, PBKDF2 password verification, safe errors, CSP and other security headers.

See [SECURITY.md](SECURITY.md) for the final audit checklist and disclosure guidance.

## Troubleshooting

### `/api/check` returns service unavailable in Production

Verify `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `PHONE_HMAC_SECRET`. Production deliberately refuses to rely on process memory for rate limiting.

### A courier shows “Temporarily unavailable”

That is expected when credentials are missing, the upstream provider fails, or the provider has an external documentation blocker. One failed provider does not suppress successful provider results.

### Admin login is unavailable

Generate and configure `ADMIN_PASSWORD_SALT`, `ADMIN_PASSWORD_HASH`, and a 32+ byte `ADMIN_SESSION_SECRET`. Production readiness reports admin configuration status without revealing values.

### Environment changes do not appear

Redeploy the Vercel project after changing environment variables.

## Deployment verification status

The repository can be validated locally without a Vercel account. Actual Vercel production deployment requires user account access and is intentionally reported as:

**VERCEL DEPLOYMENT VERIFICATION — REQUIRES USER ACCOUNT ACCESS**
