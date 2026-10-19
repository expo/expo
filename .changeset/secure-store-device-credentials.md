---
'expo-secure-store': patch
---

Add `canUseDeviceCredentialsAuthentication` function and `requireAuthentication: 'deviceCredentials'` for device credential fallback (on Android, requires API 30+). Authenticated entries written on Android are not backward compatible with older versions and may be deleted after a downgrade.

Add `requireAuthentication: 'none'` and deprecate boolean values for `requireAuthentication` - `true` and `false` still work but log a deprecation warning.
