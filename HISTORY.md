## 2026-10-22 06:57 — Assert rendered screens in the warm-link regression test
**Asked:** Address the review comment on PR #52054 using minimal-orchestrator, then run ubax-review.
**Did / why:** Replace navigation-state inspection and render-time tracking with rendered-screen assertions. Checking the linked item and the anchor's displayed ID after Back tests the behavior callers see and preserves coverage for both missing anchors and missing params. This is a test-only follow-up, so no simulator screenshots are needed.
**Verification:** The revised test fails without the anchor fix and without anchor params, then passes with both fixes. All eight deep-link tests and `et check-packages expo-router` pass.
