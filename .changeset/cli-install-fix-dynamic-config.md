---
'@expo/cli': patch
---

Fixed `npx expo install --fix` exiting with code 1 and skipping dev dependency upgrades when a project with a dynamic config upgrades a package that has a config plugin.
