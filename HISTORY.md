## 2026-11-05 01:54 PST — Record native verification
**Asked:** Run tests after storage recovered.
**Did / why:** Built and ran the current native source on an EAS iOS simulator (build `20eb8c06-2c01-4e7c-b1f5-d260a6aca23d`). Removing and restoring header options cleared and restored the Mailboxes title; leaving and re-entering Mail showed the expected headers. Saved [screenshots](screenshots/pr-52564-2026-11-05/), including the older-binary baseline. Direct `hidden: true` to `false` runtime coverage remains unavailable because the tester has no toggle; initial no-header route coverage is blocked by its “SplitView cannot be used inside another native navigator” error. Stopped both task-owned simulator sessions, Metro, and the preview host.

## 2026-11-05 01:45 PST — Verify after storage recovery
**Asked:** Run tests after more storage becomes available.
**Did / why:** Installed dependencies and passed all 40 focused SplitView tests plus the full router suite (476 suites; 6,149 passed, 9 skipped). Package build, typecheck, dependency checks, and lint passed, with one existing lint warning. Fixed the formatter-only failure in the changed return expression and reran the package formatting check successfully. Native simulator verification is tracked separately.

## 2026-11-05 01:40 PST — Push before verification
**Asked:** Push the reviewed, untested version, then run tests once storage is available.
**Did / why:** Proceed with the reviewed lifecycle simplification under explicit authorization to push before verification. Storage recovered to 13 GiB free; dependency installation and tests will follow the push.

## 2026-11-05 01:30 PST — Simplify SplitView header visibility
**Asked:** Simplify PR 52564 so SplitView column headers stay mounted when header options are omitted, and remove the unmount visibility reset.
**Did / why:** Render a header for each column and inspector with default options, allowing removal of the header prop to restore the navigation bar through the existing prop update path. Keep the attachment retry for navigation controllers that become available after mounting. Remove the unmount reset because the persistent header handles visibility changes without it.
