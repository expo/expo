---
'expo-module-template': patch
'create-expo-module': patch
---

Fix creating a standalone module with pnpm 11 and later failing with `ERR_PNPM_IGNORED_BUILDS`. When pnpm 11 or later is used and the module isn't a project of an existing pnpm workspace, the module and its example app now get their own `pnpm-workspace.yaml`, which skips the unneeded install scripts of Jest's dependencies. Inside an existing pnpm workspace that doesn't allow these scripts, `create-expo-module` now explains how to allow them. The example app's dependencies are now installed once, after the template files are in place.
