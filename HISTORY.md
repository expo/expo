## 2026-10-22 07:54 PDT — Fix CLI loader stack traces

**Asked:** Investigate the CLI failure on main using a scope spike, review the fix with ubax-review, and push it if approved.
**Did / why:** Preserve the loader transform flag in bundle URLs and URL parsing so loader and ordinary server bundles have distinct identities. Added a regression test instead of weakening the existing E2E assertions. On CI's Node 24.22.0, the baseline reproduces the wrong React JSX runtime frames and the fix passes both stack-trace E2E tests. The focused unit suite passes 20 tests, and all CLI package checks pass. No public API or UI changes.
