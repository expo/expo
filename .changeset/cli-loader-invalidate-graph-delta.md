---
'@expo/cli': patch
---

Fix the development server refetching loader data on every page for every file change. The server now sends `loader-invalidate` only when a change is in the module graph of a route with a loader. A change to a file that a loader reads at run time and does not import no longer refetches loader data.
