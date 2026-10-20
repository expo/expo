---
'expo-clipboard': patch
---

Add `expiresAt` and `ios.localOnly` options to `setStringAsync`. On iOS they map to the pasteboard's expiration date and local-only options. On Android the module clears the copy when it expires, unless the clipboard already holds newer content.
