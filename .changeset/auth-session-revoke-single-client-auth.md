---
'expo-auth-session': patch
---

Fix `RevokeTokenRequest` sending client credentials in both the `Authorization: Basic` header and the request body when `clientSecret` is set, which strict OAuth servers reject with `invalid_client` (RFC 6749 §2.3). The credentials are now sent only in the header, matching `AccessTokenRequest` and `RefreshTokenRequest`.
