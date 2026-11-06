---
'expo-keep-awake': patch
---

[iOS] Calling `activate` or `deactivate` of the native module with a wrong number of arguments now throws an error with the `ERR_ARGUMENTS_RANGE_MISMATCH` code instead of `ERR_INVALID_ARGS_NUMBER`.
