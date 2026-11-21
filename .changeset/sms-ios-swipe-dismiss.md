---
'expo-sms': patch
---

[iOS] Fix `sendSMSAsync` never settling when the user dismisses the composer with a swipe or a tap outside it. It now resolves with `{ result: 'cancelled' }`, and later calls no longer fail with "SMS sending in progress".
