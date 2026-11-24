---
'expo-crypto': patch
---

[iOS] `AESSealedData.fromCombined` and `fromParts` now reject negative lengths and combined data shorter than the IV and the tag with `ERR_INVALID_SEALED_DATA_CONFIG`, like Android and web do, instead of crashing or building malformed sealed data. A negative nonce length passed to `aesEncryptAsync` rejects with `ERR_NONCE_GENERATION_FAILED` instead of crashing.
