---
'expo-crypto': patch
---

[iOS] AES encryption, decryption, and sealed data errors now have the `ERR_ENCRYPTION_FAILED`, `ERR_DECRYPTION_FAILED`, and `ERR_INVALID_SEALED_DATA_CONFIG` codes instead of `ERR_UNEXPECTED`. An invalid enum argument, such as an unsupported key size, now rejects with `ERR_ENUM_NO_SUCH_VALUE` instead of `ERR_ARGUMENT_CAST`.
