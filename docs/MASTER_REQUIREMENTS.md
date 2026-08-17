# MASTER PROMPT — Bangladesh Courier Fraud / Customer Delivery History Checker

You are the lead full-stack engineer, software architect, security engineer, QA engineer, and DevOps engineer for this project.

Your task is to BUILD, COMPLETE, TEST, SECURE, and VERIFY a production-ready Bangladesh Courier Customer Delivery History / Fraud Risk Checker.

Do not stop after generating a plan or partial code.

You must inspect the project, create and maintain a TODO list, implement tasks one by one, test your work, fix errors, perform a security review, and continue until all critical project requirements are completed.

---

# 1. PROJECT GOAL

Build a fast, modern web application where a user enters a Bangladeshi mobile number and the system checks available delivery-history information from these four courier services:

1. Steadfast
2. Pathao
3. RedX
4. Carrybee

The application should aggregate the available results and display an easy-to-understand customer delivery/risk summary.

IMPORTANT:

Do NOT falsely label a person as a criminal or confirmed "fraudster."

The application should primarily use terms such as:

- Customer Delivery History
- Courier History
- Delivery Success Rate
- Return/Cancellation History
- Risk Indicator
- Insufficient Data

Courier history is only a decision-support signal and must not be presented as proof that someone committed fraud.

---

# 2. FIRST ACTION — INSPECT EVERYTHING

Before changing code:

1. Inspect the entire repository.
2. Identify the framework, language, dependencies, database, API structure, frontend architecture, deployment configuration, environment files, and existing features.
3. Find incomplete code, broken routes, TODO/FIXME comments, duplicated logic, security problems, dead code, and configuration issues.
4. Understand the existing project before making architectural changes.

Do NOT unnecessarily rewrite working parts of the application.

Preserve good existing functionality.

---

# 3. CREATE AND MAINTAIN TODO.md

Create:

`TODO.md`

Organize work into sections such as:

## Phase 1 — Project Audit

## Phase 2 — Architecture

## Phase 3 — Database

## Phase 4 — Courier Integration

## Phase 5 — Backend API

## Phase 6 — Fraud/Risk Calculation

## Phase 7 — Frontend

## Phase 8 — Admin

## Phase 9 — Security

## Phase 10 — Testing

## Phase 11 — Performance

## Phase 12 — Deployment

## Phase 13 — Final Audit

Use:

-  Pending
-  Completed
- [!] Blocked

Update TODO.md continuously.

Do not mark a task completed until the implementation has actually been verified.

Continue working through the TODO list until all non-blocked critical tasks are completed.

---

# 4. COURIER ARCHITECTURE

Create a modular courier integration architecture.

Use a common interface similar to:

CourierProvider

Each courier implementation should be isolated:

SteadfastProvider
PathaoProvider
RedXProvider
CarrybeeProvider

Do NOT tightly couple courier-specific code to controllers or UI.

The normalized response should use a common internal structure.

Example concept:

{
"courier": "steadfast",
"available": true,
"total": 15,
"delivered": 12,
"returned": 3,
"cancelled": 0,
"success\_rate": 80
}

Adjust fields based on what the official/authorized courier API actually provides.

Never invent unavailable data.

---

# 5. CRITICAL COURIER API RULE

Use ONLY legitimate, authorized courier APIs or integrations available to the project.

Never:

- bypass authentication
- bypass OTP
- scrape protected/private dashboards without authorization
- reverse-engineer authentication to evade access controls
- expose merchant credentials
- fabricate courier results

If credentials/documentation for a courier are unavailable:

1. Implement the provider interface.
2. Implement configuration/environment variables.
3. Clearly mark the integration as blocked in TODO.md.
4. Document exactly what credential/API access is required.
5. Keep the rest of the application fully functional.

One unavailable courier MUST NOT break results from other couriers.

Use fault isolation.

---

# 6. PARALLEL COURIER LOOKUPS

Where appropriate, query independent courier providers concurrently instead of sequentially.

Example:

Steadfast ─┐
Pathao ────┤
RedX ──────┼──> Normalizer → Aggregator → Risk Engine
Carrybee ──┘

Set sensible per-provider timeouts.

A slow courier API must not freeze the entire request.

Use Promise.allSettled(), concurrent requests, async workers, or the equivalent supported by the chosen stack.

---

# 7. MOBILE NUMBER VALIDATION

Support Bangladeshi numbers.

Accept common formats such as:

017XXXXXXXX
88017XXXXXXXX
+88017XXXXXXXX

Normalize internally to one canonical format.

Reject malformed numbers.

Never send malformed numbers to courier APIs.

Validation must exist on BOTH:

frontend
and
backend.

Backend validation is authoritative.

---

# 8. SEARCH API

Create a clean internal endpoint such as:

POST /api/check

Example request:

{
"phone": "017XXXXXXXX"
}

Return a normalized aggregated response.

Example structure:

{
"phone\_masked": "017\*\*\*\*1234",
"summary": {
"total\_orders": 40,
"delivered": 32,
"returned": 8,
"success\_rate": 80,
"risk": "LOW"
},
"couriers": [],
"checked\_at": "..."
}

Do not expose unnecessary personal data.

---

# 9. RESULT CALCULATION

Calculate only from successfully retrieved and semantically compatible data.

At minimum support:

Total Orders
Successful Deliveries
Returned/Cancelled Orders
Delivery Success Rate
Return Rate
Number of Couriers Reporting Data

Avoid double-counting or combining incompatible courier fields blindly.

Document aggregation assumptions.

Handle:

zero orders
partial provider failure
timeout
invalid response
missing fields
courier maintenance
authentication failure
rate limiting

without crashing the application.

---

# 10. RISK ENGINE

Create a transparent and configurable risk engine.

Possible result labels:

LOW
MODERATE
HIGH
INSUFFICIENT\_DATA

Do not claim that HIGH means the person committed fraud.

Display something similar to:

"Risk indicators are based on available courier delivery history and should not be treated as proof of fraudulent activity."

Keep thresholds configurable rather than scattering hardcoded values throughout the application.

Document the logic.

Avoid opaque or discriminatory scoring.

---

# 11. FRONTEND

Build a professional, extremely clean interface.

Primary homepage structure:

Header

Hero:
"Check Customer Delivery History"

Subtitle:
"Check available delivery history across major Bangladesh courier services before processing an order."

Phone Number Input

CHECK NOW button

Supported Couriers:
Steadfast
Pathao
RedX
Carrybee

Result section should show:

Overall Delivery Success Rate
Total Orders
Delivered
Returned/Cancelled
Risk Indicator

Then show four courier result cards.

Example:

Steadfast
Total: 15
Delivered: 13
Returned: 2
Success: 86.67%

Do the equivalent for every available courier.

---

# 12. UX STATES

Create polished states for:

Initial
Loading
Success
Partial Success
No Data
Invalid Number
Rate Limited
Courier Temporarily Unavailable
Server Error

During checking, show individual courier progress where useful:

Checking Steadfast...
Checking Pathao...
Checking RedX...
Checking Carrybee...

Never display raw stack traces or internal API errors to users.

---

# 13. MOBILE-FIRST

The website must work extremely well on mobile.

Test:

320px
375px
390px
430px
768px
1024px
Desktop

No horizontal scrolling.

Buttons must be easy to tap.

Input must be mobile-friendly.

Results must remain readable on small displays.

---

# 14. DESIGN

Use a modern SaaS-style design.

Requirements:

Clean
Minimal
Fast
Professional
Accessible
Responsive

Avoid unnecessary animations and huge dependencies.

Use semantic HTML and accessible components.

Provide clear focus states.

Maintain sufficient contrast.

Support keyboard navigation.

---

# 15. ADMIN SYSTEM

If the project does not already contain administration, create a secure minimal admin area.

Admin features:

Dashboard
Search statistics
Courier health/status
Provider configuration status
Recent system errors
Rate-limit statistics
Application health

Do NOT display API secrets in plaintext.

Do NOT unnecessarily store complete searched phone numbers.

---

# 16. PRIVACY-FIRST SEARCH LOGGING

Phone numbers are personal data.

Minimize collection.

Prefer storing:

masked phone
or
one-way keyed hash/HMAC where lookup correlation is necessary

rather than raw numbers.

Do not log complete numbers in application logs.

Do not send phone numbers to analytics platforms.

Do not put phone numbers in URLs.

Never use:

GET /check?phone=017...

for sensitive lookup requests.

Use POST.

Set appropriate cache behavior for sensitive responses.

---

# 17. DATABASE

Use the project's existing database if one exists.

Only introduce new infrastructure when justified.

Create proper migrations.

Potential tables:

admins/users
search\_logs
provider\_health
audit\_logs
app\_settings

Do NOT create unnecessary tables.

Add indexes for frequently queried columns.

Never store courier API passwords/tokens directly in normal database fields unless there is a secure encrypted secret-management requirement.

---

# 18. ENVIRONMENT VARIABLES

Create/update:

`.env.example`

Example conceptual configuration:

APP\_URL=
DATABASE\_URL=

STEADFAST\_API\_URL=
STEADFAST\_API\_KEY=
STEADFAST\_SECRET=

PATHAO\_API\_URL=
PATHAO\_CLIENT\_ID=
PATHAO\_CLIENT\_SECRET=

REDX\_API\_URL=
REDX\_API\_KEY=

CARRYBEE\_API\_URL=
CARRYBEE\_API\_KEY=

Actual variable requirements must follow authorized API documentation.

Never hardcode secrets.

Never commit `.env`.

Verify `.gitignore`.

---

# 19. SECURITY AUDIT — MANDATORY

Perform a complete security review.

Check for:

SQL Injection
XSS
CSRF
SSRF
Command Injection
Path Traversal
Broken Authentication
Broken Authorization
IDOR
Open Redirects
Credential Leakage
Sensitive Log Leakage
Mass Assignment
Unsafe File Access
Prototype Pollution where relevant
Insecure Dependencies
Weak Session Configuration
Missing Security Headers
CORS Misconfiguration
Rate-Limit Bypass
API Abuse
Brute Force
Information Disclosure

Fix discovered vulnerabilities.

---

# 20. SERVER-SIDE REQUEST SECURITY

Courier integrations create outbound server requests.

Protect against SSRF.

Courier base URLs must come from trusted configuration.

Never accept an arbitrary courier URL from a public request.

Allow only expected protocols/hosts where practical.

Use HTTPS for production courier endpoints.

Set connection/request timeouts.

Limit response sizes where supported.

Validate returned data before processing it.

---

# 21. RATE LIMITING

The fraud-check endpoint can be abused.

Implement rate limiting.

Use sensible limits per IP/session/account depending on architecture.

Return HTTP 429 when appropriate.

Do not reveal internal rate-limit implementation details.

Design the limiter so distributed deployment can later use Redis or another shared store if necessary.

---

# 22. SECURITY HEADERS

Configure appropriate headers such as:

Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
Strict-Transport-Security in HTTPS production

Use framework-native security features where possible.

Do not blindly configure headers that break required application functionality.

---

# 23. AUTHENTICATION SECURITY

For admin authentication:

Use secure password hashing such as Argon2id or the framework's strong recommended password hasher.

Never store plaintext passwords.

Use:

Secure cookies
HttpOnly
SameSite
CSRF protection
session expiration

where applicable.

Protect admin routes with server-side authorization.

Frontend route hiding is NOT authorization.

---

# 24. ERROR HANDLING

Implement centralized error handling.

Differentiate internally between:

validation error
provider timeout
provider authentication error
provider rate limit
provider unavailable
database error
unexpected server error

Return safe public messages.

Log enough diagnostic information to troubleshoot WITHOUT leaking secrets or complete phone numbers.

---

# 25. API RESILIENCE

Courier APIs may fail.

Implement where appropriate:

timeouts
limited retries
exponential backoff
provider health tracking
graceful degradation

Do NOT retry requests endlessly.

Do NOT retry authentication failures blindly.

Partial results should be allowed.

Example:

3 couriers successful
1 unavailable

The user should still receive the successful three results with the unavailable provider clearly identified.

---

# 26. CACHE

If allowed by courier terms and privacy requirements, implement a short-lived server-side cache to prevent unnecessary duplicate requests.

Cache keys involving phone numbers must not expose raw phone numbers.

Use a keyed hash/HMAC.

Never expose sensitive cached results publicly.

Document TTL.

Provide a way to disable caching.

---

# 27. TESTING — REQUIRED

Create automated tests.

Unit tests:

Bangladesh phone normalization
validation
success-rate calculation
risk calculation
normalization
provider response parsing

Integration tests:

Steadfast adapter
Pathao adapter
RedX adapter
Carrybee adapter

Use mocks/fixtures for automated tests instead of consuming real courier API quota.

API tests:

valid number
invalid number
no data
one provider failure
multiple provider failure
timeout
429
unexpected provider response

Security tests:

unauthorized admin access
rate limiting
malformed payloads
XSS payloads
SQL injection-style payloads
oversized requests
secret leakage

---

# 28. DO NOT TEST DESTRUCTIVELY AGAINST PRODUCTION

Never perform destructive or abusive security testing against real courier production systems.

Security testing must target our own application/local test environment.

Do not flood courier APIs.

Respect their rate limits and terms.

---

# 29. PERFORMANCE

Optimize for fast real-world performance.

Targets where practical:

Minimal frontend JavaScript
Lazy-load non-critical assets
Optimized fonts
Optimized images
Compression
Efficient DB queries
Connection reuse
Parallel provider requests
Reasonable caching
No unnecessary dependencies

The external courier APIs will usually determine most lookup latency, so prioritize perceived speed and graceful partial results.

---

# 30. OBSERVABILITY

Implement safe application monitoring.

Track:

request count
successful checks
partial checks
failed checks
provider latency
provider failure rate
HTTP errors

Do NOT send complete phone numbers or API credentials to monitoring tools.

Provide:

GET /health

and, if appropriate:

GET /ready

Do not expose sensitive system information through health endpoints.

---

# 31. DEPENDENCY AUDIT

Inspect all dependencies.

Remove unused packages.

Check for known vulnerabilities using the ecosystem's appropriate audit tools.

Upgrade vulnerable packages carefully.

Do not blindly perform major upgrades that could break the application.

After upgrades:

build
test
lint
type-check

again.

---

# 32. CODE QUALITY

Use:

clear naming
small focused functions
strict typing where available
schema validation
central configuration
reusable provider interfaces
separation of concerns

Avoid:

giant controllers
duplicated courier logic
hardcoded secrets
magic numbers
silent catch blocks
unnecessary abstraction

Comment WHY when necessary, not obvious WHAT.

---

# 33. DOCUMENTATION

Create/update:

README.md
TODO.md
.env.example

README must contain:

Project overview
Features
Architecture
Requirements
Installation
Environment setup
Database setup
Development commands
Testing commands
Production build
Courier configuration
Security notes
Deployment instructions
Troubleshooting

Include documentation for adding another courier provider later.

---

# 34. LOCAL DEVELOPMENT

The project should be runnable using clear commands.

Verify the complete local setup yourself.

The README must make it possible for another developer to clone the project, configure environment variables, install dependencies, run migrations, and start the application without guessing undocumented steps.

---

# 35. PRODUCTION DEPLOYMENT

Prepare the application for Linux VPS deployment.

Where appropriate support:

Docker
Docker Compose
reverse proxy
HTTPS
production environment variables
database persistence
automatic restart
health checks
structured logs

Do not expose databases directly to the public internet.

Do not expose unnecessary application ports.

Run services using least privilege.

Do not run the application as root unless absolutely required by the environment.

---

# 36. BACKUP AND ROLLBACK

Before changing an existing production deployment:

create a backup or rollback point.

For database schema changes:

use safe migrations.

Document rollback steps.

Never destroy production data simply to make a migration easier.

---

# 37. VERIFICATION LOOP

After every major implementation phase:

1. Build
2. Lint
3. Type-check
4. Run unit tests
5. Run integration tests
6. Run relevant security checks
7. Fix failures
8. Repeat

Do not continue while knowingly leaving critical regressions behind.

---

# 38. BROWSER VERIFICATION

Actually verify the finished application in a browser if browser tooling is available.

Test:

Homepage loads
Phone input works
Validation works
Check button works
Loading UI works
Results render
Partial failures render
Mobile layout works
Admin authentication works
No major console errors
No broken network requests
No obvious accessibility problems

Do not assume that successful compilation means the website works.

---

# 39. REAL API VERIFICATION

When valid courier sandbox/production credentials are available:

perform a minimal authorized end-to-end verification for each provider.

Do not expose credentials in terminal output, screenshots, logs, commits, or reports.

If credentials are unavailable, automated mocks can verify our implementation, but the provider must remain marked:

BLOCKED — REAL API VERIFICATION REQUIRED

Never claim real integration is verified when only mocks were tested.

---

# 40. DEFINITION OF DONE

The project is NOT finished simply because the UI looks complete.

It is finished only when:

- application builds successfully
- frontend works
- backend works
- database migrations work
- phone validation works
- normalization works
- aggregation works
- risk calculation works
- provider failure isolation works
- configured courier integrations work
- automated tests pass
- security review is complete
- critical vulnerabilities are fixed
- production build passes
- documentation is complete
- TODO.md has no unresolved critical item except clearly documented external blockers
- browser verification passes

---

# 41. FINAL AUDIT

Before declaring completion:

Re-read this entire specification.

Re-open TODO.md.

Inspect the repository again.

Look specifically for:

unfinished TODOs
temporary mocks accidentally enabled
hardcoded credentials
debug routes
console logs containing sensitive data
test endpoints
disabled authentication
development configuration
broken mobile layouts
unhandled provider failures
unused files
dependency vulnerabilities

Fix all applicable issues.

---

# 42. FINAL REPORT

When finished, provide a concise report containing:

## Completed

What was implemented.

## Courier Status

Steadfast — VERIFIED / BLOCKED
Pathao — VERIFIED / BLOCKED
RedX — VERIFIED / BLOCKED
Carrybee — VERIFIED / BLOCKED

For every BLOCKED provider, explain exactly what external credential/documentation/access is still required.

## Tests

Tests executed and results.

## Security

Security checks performed and issues fixed.

## Performance

Important optimizations performed.

## Deployment

How to run/deploy the finished application.

## Remaining External Requirements

Only items genuinely outside the repository/project.

---

# EXECUTION RULE

DO NOT JUST TELL ME HOW TO BUILD THIS PROJECT.

BUILD IT.

Do not stop after creating TODO.md.

Do not stop after creating the frontend.

Do not stop after implementing one courier.

Do not repeatedly ask me what to do next when the next action can be determined from this specification and the repository.

Work autonomously through the TODO list.

When you encounter a normal implementation problem:

investigate → fix → test → continue.

Ask me only when you genuinely require information that cannot be derived from the repository or safely decided, such as missing authorized courier credentials.

Never fabricate credentials, API responses, completed tests, or successful integrations.

Continue until the Definition of Done is satisfied or the only remaining items are clearly documented external blockers.