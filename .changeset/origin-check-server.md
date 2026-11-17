---
"expo-server": minor
---

Reject cross-origin form-compatible mutations by default, before middleware and route handlers run. Pass `checkOrigin: false` as the second adapter handler argument when providing application-specific CSRF protection.
