## 2026-10-23 04:47 — Remove PR screenshots
**Asked:** Remove the screenshots from the PR.
**Did / why:** Removed the four screenshot files and their links, keeping the recorded verification results.

## 2026-10-23 04:05 PDT — Integrate Expo Router navigation review
**Asked:** Integrate the concurrent update to expo/expo#51571 and keep only useful follow-up changes.
**Did / why:** Kept the PR author's rebased `getSingularId` fix, changeset, and parameter tests. Added a resolver regression guard for descent into a matching mounted layout and used `navigate` in the existing reuse test to cover the reported action without duplicating cases.
**Earlier iOS evidence:** The EAS iOS Simulator run used local revision `c5b52f81769685d43711ae44c5627ce83d6cb205`, before the PR was rebased onto `e2815a018c5be1cb16260f8c2217c0aa6056faaa`. In that run, `/acme/web` used layout 1, `/acme/api` created layout 2, `/other/web` created layout 3, and `/acme/web/settings` reused layout 1. Back navigation returned to the expected screen. The rebased PR revision was not run on a device.
