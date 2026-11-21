---
'expo-router': patch
---

Use the redirect of the outermost failing guard for nested protected routes. In SDK 58, the innermost failing guard decided the redirect.
