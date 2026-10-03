---
'@expo/cli': patch
---

Cache the evaluated dev-server API route module between requests, instead of re-evaluating it on every request, so module-scope state (counters, long-lived connections, timers) persists across requests like it does in production instead of resetting each time.
