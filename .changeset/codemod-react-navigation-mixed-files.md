---
'expo-codemod': patch
---

Fix `sdk-56-expo-router-react-navigation-replace` silently skipping migratable `@react-navigation/*` imports when a file also contained an unsupported import (e.g. `@react-navigation/native-stack`). Supported named imports are now migrated while unsupported ones are still reported for manual migration.
