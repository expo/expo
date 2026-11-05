## 2026-11-05 05:47 PST — Spike Stack/SplitView header handoff with swizzling
**Asked:** Build a simpler spike on `test/pr-52564-header-gesture`, showing the Stack header above root, preparing it before pushing, and restoring the split header only after returning to root.
**Did / why:** Added three narrowly scoped Screens hooks in the existing native header view, avoiding header copying, JavaScript navigation state, and a Screens patch. Added native regression tests and an isolated Router Tester demo. All 46 native tests and 6,149 router tests pass; iPhone and iPad simulator checks cover root/push/pop, with interactive cancellation, modals, hidden headers, and retained state checked on iPhone. Large-title expansion remains an explicit spike limitation. See [scope and evidence](SPLIT_STACK_SWIZZLE_SPIKE.md) and [screenshots](screenshots/split-stack-swizzle).

## 2026-11-05 01:45 PST — Verify after storage recovery
**Asked:** Run tests after more storage becomes available.
**Did / why:** Installed dependencies and passed all 40 focused SplitView tests plus the full router suite (476 suites; 6,149 passed, 9 skipped). Package build, typecheck, dependency checks, and lint passed, with one existing lint warning. Fixed the formatter-only failure in the changed return expression and reran the package formatting check successfully. Native simulator verification is tracked separately.

## 2026-11-05 01:40 PST — Push before verification
**Asked:** Push the reviewed, untested version, then run tests once storage is available.
**Did / why:** Proceed with the reviewed lifecycle simplification under explicit authorization to push before verification. Storage recovered to 13 GiB free; dependency installation and tests will follow the push.

## 2026-11-05 01:30 PST — Simplify SplitView header visibility
**Asked:** Simplify PR 52564 so SplitView column headers stay mounted when header options are omitted, and remove the unmount visibility reset.
**Did / why:** Render a header for each column and inspector with default options, allowing removal of the header prop to restore the navigation bar through the existing prop update path. Keep the attachment retry for navigation controllers that become available after mounting. Remove the unmount reset because the persistent header handles visibility changes without it.
