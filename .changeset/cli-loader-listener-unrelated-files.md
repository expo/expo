---
'@expo/cli': patch
---

Stop clearing server modules and sending `loader-invalidate` when a file outside the loader graph changes. Before this fix, saving any file while an API route still had work running could stop `expo start`.
