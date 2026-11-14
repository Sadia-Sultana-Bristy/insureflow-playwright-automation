# Project Plan: InsureFlow UI Automation

## 1. Project name

**InsureFlow – Playwright UI Automation Framework**
Repository: `insureflow-playwright-automation`

## 2. Business scenario

InsureFlow is a fictional insurer that sells Auto, Home, Travel and Health cover through a customer self-service portal. The business relies on the portal for three revenue- and trust-critical journeys:

| Journey | Business risk if it breaks |
|---|---|
| **Quote and buy**: a 3-step wizard with instant pricing | Lost sales; wrong premiums create regulatory and financial exposure |
| **Claims**: filing against an active policy, with eligibility rules | Customer complaints; invalid claims get through and add manual review cost |
| **Portfolio self-service**: dashboard, search, filter, policy details | More call-centre volume; customers see wrong coverage data |

The automation suite acts as the **release gate** for these journeys. Smoke tests run on every PR, the full regression runs nightly, and the suite runs across browsers in CI.

## 3. Why this project is valuable for a portfolio

- **Domain realism.** Insurance rules (pricing formulas, minimum premium, coverage limits, policy status, claim eligibility) are what QA engineers test day to day in fintech and insurtech. They go well beyond "login and add to cart".
- **It shows test design, not just tool usage.** It includes boundary values (90-day start date), equivalence classes (invalid amounts), a test oracle (independent premium calculator) and state transitions (Pending versus Active).
- **It's production-shaped.** It uses storage-state authentication, fixtures, components, tags, parallel execution, retries, traces, JUnit output and a CI matrix, the same building blocks as an enterprise framework.
- **It's reliable.** It's self-contained and deterministic, checked with 100 repeated parallel runs and 0 flakes. Reviewers can clone it and get green results in a few minutes.

## 4. Testing scope

**In scope (UI functional):** authentication and session, navigation, dashboard KPIs, policy search/filter/sort, policy details, the quote wizard and pricing, claim submission and validation, error and empty states, and a cross-module E2E workflow, on Chromium and Firefox.

**Out of scope:** API contract tests, performance and load, security and penetration testing, visual regression, accessibility audits, mobile viewports. These are listed in the README as possible extensions.

**Test types:**

| Type | Tag | Purpose |
|---|---|---|
| Smoke | `@smoke` | Critical path: login, dashboard, search, claim, E2E (about 10 seconds) |
| Regression | `@regression` | The full functional suite |
| Negative | `@negative` | Invalid credentials, locked account, not-found, ineligible actions |
| Validation | `@validation` | Field rules: required, format, range, boundary |
| End-to-end | `@e2e` | A business workflow across modules |

## 5. Skills demonstrated

- Playwright Test: projects, dependencies, `webServer`, storage state, tags, `test.step`, annotations, attachments, web-first assertions, traces
- Page Object Model with inheritance (`BasePage`) and composition (Header, DataTable and Form components)
- Custom fixtures and dependency injection (`loginAs`, page objects, test data)
- Data-driven testing from JSON, plus a test-data factory for unique data
- Test design techniques: boundary value analysis, equivalence partitioning, state transitions, test oracles
- Resilient locators (`getByRole`, `getByLabel`, `data-testid`) with no fixed waits
- CI/CD with GitHub Actions: browser matrix, caching, artifacts, scheduled and manual runs with tag filters
- Reporting: HTML, JUnit and GitHub annotations, plus screenshot evidence at business checkpoints
- Environment configuration with `.env` and `BASE_URL` overrides
