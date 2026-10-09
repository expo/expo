---
'create-expo-module': patch
---

Roll back files written by module creation or `add-platform-support` when generation fails, and remove downloaded template directories. An invalid `--source` path is now reported without a stack trace.
