---
'@expo/cli': patch
'@expo/metro-config': patch
---

Fix `expo export` corrupting Hermes bytecode when renaming DOM component html assets: the rename is now applied to the serialized JS and bytecode compilation is deferred until after DOM component exports. Previously the placeholder filename was binary-patched inside the compiled `.hbc`, which could overwrite bytes of neighbouring overlap-packed strings (e.g. unrelated string literals such as API keys). `@expo/metro-config` exposes the bytecode step as `transformJsAssetToHermesBytecodeAsync` so the export can run it after the renames.
