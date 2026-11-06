---
"expo-app-intents": patch
---

[iOS] Decode donation params on the JavaScript thread through `decode(_:in:)` instead of `from(dictionary:)`, so a `@Record` type works as `DonationParams`.
