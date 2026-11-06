---
'expo-linking': patch
---

[iOS] Calling `getLinkingURL` or `clearInitialURL` with arguments now throws an error with the `ERR_ARGUMENTS_RANGE_MISMATCH` code instead of `ERR_INVALID_ARGS_NUMBER`.
