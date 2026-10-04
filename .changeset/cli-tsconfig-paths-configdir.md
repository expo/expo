---
'@expo/cli': patch
---

Resolve `${configDir}` in tsconfig `paths` and `baseUrl` to the directory of the project's tsconfig, as TypeScript does, including when it appears in an extended config. Absolute `paths` targets are no longer joined to the config directory.
