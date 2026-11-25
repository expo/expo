---
'expo-app-metrics': minor
---

Apply the consent value from `Observe.setConsent`. A saved value overrides the `consent` option of the `expo-observe` config plugin on later launches. Without consent, startup metrics stay in memory until a grant saves them.
