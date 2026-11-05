## 2026-11-05 01:40 PST — Push before verification
**Asked:** Push the reviewed, untested version, then run tests once storage is available.
**Did / why:** Proceed with the reviewed lifecycle simplification under explicit authorization to push before verification. Storage recovered to 13 GiB free; dependency installation and tests will follow the push.

## 2026-11-05 01:30 PST — Simplify SplitView header visibility
**Asked:** Simplify PR 52564 so SplitView column headers stay mounted when header options are omitted, and remove the unmount visibility reset.
**Did / why:** Render a header for each column and inspector with default options, allowing removal of the header prop to restore the navigation bar through the existing prop update path. Keep the attachment retry for navigation controllers that become available after mounting. Remove the unmount reset because the persistent header handles visibility changes without it.
