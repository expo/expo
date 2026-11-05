## 2026-11-05 05:40 PST — Spike native Stack ownership in SplitView
**Asked:** Compare the two ENG-28808 approaches in a new isolated worktree and spike real Stack/SplitView integration through Screens swizzling, without a plan challenge or animation workarounds.
**Did / why:** Built an opt-in native ownership prototype that keeps the original Screens navigation controller, delegate, and navigation items. Six focused native tests and the app build pass. Real iOS 26.5 EAS testing shows expanded root ownership works, but collapsed adoption blanks content and expanded pushes lose title/inset behavior. Preserved this failing experiment instead of treating root screenshots as complete integration. The report scopes attachment, collapse composition, header/layout callbacks, frame observation, gestures, and teardown. Final tester typecheck reports three `/404` typed-route errors in untouched routes after Metro generated route types. Screenshots and the full findings are in [scope-spike/ENG-28808](scope-spike/ENG-28808/scope-spike-report.md), including iPhone failure and iPad before/after snapshots. No PR or Linear comment was posted.

## 2026-11-05 01:45 PST — Verify after storage recovery
**Asked:** Run tests after more storage becomes available.
**Did / why:** Installed dependencies and passed all 40 focused SplitView tests plus the full router suite (476 suites; 6,149 passed, 9 skipped). Package build, typecheck, dependency checks, and lint passed, with one existing lint warning. Fixed the formatter-only failure in the changed return expression and reran the package formatting check successfully. Native simulator verification is tracked separately.

## 2026-11-05 01:40 PST — Push before verification
**Asked:** Push the reviewed, untested version, then run tests once storage is available.
**Did / why:** Proceed with the reviewed lifecycle simplification under explicit authorization to push before verification. Storage recovered to 13 GiB free; dependency installation and tests will follow the push.

## 2026-11-05 01:30 PST — Simplify SplitView header visibility
**Asked:** Simplify PR 52564 so SplitView column headers stay mounted when header options are omitted, and remove the unmount visibility reset.
**Did / why:** Render a header for each column and inspector with default options, allowing removal of the header prop to restore the navigation bar through the existing prop update path. Keep the attachment retry for navigation controllers that become available after mounting. Remove the unmount reset because the persistent header handles visibility changes without it.
