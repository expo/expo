---
"@expo/cli": minor
---

Emit `{scheme}://?__expo_url={manifestUrl}` development build launch URLs instead of the legacy `{scheme}://expo-development-client/?url={manifestUrl}` form.

Add `EXPO_NO_DEV_MENU=1` to append the reserved `__expo_*` params that keep the dev menu closed to Expo Go and development build launch URLs: the terminal URL, the QR code, `/_expo/link`, `/_expo/open`, `expo start --ios/--android` and `expo run:*`.
