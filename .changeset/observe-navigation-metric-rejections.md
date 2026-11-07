---
'expo-observe': patch
---

Stop navigation metrics (`cold_ttr`, `warm_ttr` and `tti`) that cannot be stored in the session from causing unhandled promise rejections. The failure is logged as a warning in development.
