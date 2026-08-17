# Security

## Security model

This application handles phone numbers as personal data and courier credentials as server-side secrets. The public browser communicates only with same-origin `/api/*` endpoints.

## Implemented controls

- No courier secret is referenced by browser JavaScript.
- No raw phone number is placed in a URL or returned in public JSON.
- `POST /api/check` validates origin, content type, request size and phone schema.
- Provider URLs cannot be supplied by public requests.
- Live Steadfast calls require an HTTPS base URL and use a strict timeout.
- Provider results are normalized and upstream response size is bounded before parsing.
- Courier requests run concurrently with per-provider error capture so one provider failure cannot reject the aggregate request.
- Production rate limiting requires a shared Upstash backend and fails closed if unavailable.
- Redis identifiers use HMAC-derived keys.
- Admin passwords use PBKDF2-SHA256 with 210,000 iterations and unique salt.
- Admin sessions are HMAC signed, HttpOnly and SameSite=Strict; Secure is enabled in production.
- CSP, HSTS, no-sniff, frame denial, restrictive referrer and permissions headers are configured.
- Sensitive API responses use `no-store`.
- No third-party analytics is included.

## Threat review

| Area | Result |
|---|---|
| Secrets exposure | Server-side environment variables only; `.env*` ignored except example |
| XSS | No user HTML injection; UI uses `textContent`; CSP blocks inline/third-party scripts |
| CSRF | Same-origin validation on state-changing API/admin requests plus SameSite cookies |
| SQL injection | No SQL/database layer exists in this build |
| SSRF | Public input cannot set provider URLs; live base must be trusted configuration and HTTPS |
| Broken authorization | Admin dashboard checks signed session server-side |
| Rate-limit bypass | Production uses shared external storage and the Vercel-generated client-IP header, not caller-controlled fallback identity or per-instance memory |
| Sensitive logging | Application contains no phone-number console logging |
| Environment leakage | Public readiness exposes only `ready` / `not_ready`; admin configuration diagnostics require authentication and never expose values |
| Debug endpoints | No debug/test endpoint is shipped |
| Dependency risk | Zero production/runtime npm dependencies; one pinned TypeScript development dependency |
| CORS | No permissive CORS headers; browser APIs are same-origin |
| Cookies/session | HttpOnly, SameSite=Strict, production Secure, expiration enforced |
| Redirects | No user-controlled redirect implementation |
| Provider response safety | Counts validated, payload size bounded, raw payload not forwarded |

## Real provider testing

Do not run destructive tests, credential guessing, OTP bypass, dashboard scraping, or production load tests against courier systems. Real verification must use authorized merchant credentials and minimal requests.

## Reporting a vulnerability

Do not post credentials or personal phone numbers in a public issue. Report the minimal reproduction privately to the repository owner and rotate any credential that may have been exposed.

## Static source isolation

Only `public/` is configured as Vercel's static output directory. Server source, tests, documentation, scripts, and environment templates are not intended to be directly served as website assets.

- Readiness details are evaluated server-side; the public `/api/ready` response exposes only `ready` or `not_ready`.
