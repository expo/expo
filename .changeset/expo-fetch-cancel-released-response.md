---
'expo': patch
---

Fix an unhandled promise rejection (`Cannot use shared object that was already released`) when `expo/fetch` cancels the body of a response that native code already released.
