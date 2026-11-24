---
'expo-sms': patch
---

[iOS] Fix `sendSMSAsync` never settling when there is no view controller to present the composer. It now rejects, and later calls no longer fail as pending.
