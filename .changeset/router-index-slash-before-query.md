---
'expo-router': patch
---

Stop adding a slash before the query when the params of an index route in a group change, for example with `router.setParams`.
