# Device transformer

Builds the on-device Babel payload used by Expo Go to transpile edits to
published projects. The payload runs in the standalone Hermes JSI runtime in
`EXOnDeviceTransformer.mm` and exposes:

```js
transformModule(source, filename, moduleId, depIds) // => { code, depNames }
```

## Rebuild

Run from an installed Expo monorepo checkout:

```bash
cd apps/expo-go/tools/device-transformer
node build-slim.js
node baseline-slim.js
node test-extraction.js
```

`build-slim.js` writes intermediate files to `dist/` and copies the minified
payload to
`apps/expo-go/ios/Exponent/DevMenu/ProjectSource/Resources/device-transformer.js`.
Set `EXPO_DIR` only when intentionally building against another checkout.

The build applies three Hermes compatibility steps:

1. esbuild lowers dynamic `import()` calls that Hermes cannot parse.
2. Babel's V8-specific deprecation warning helper is replaced with a no-op.
3. Babel's block scoping transform lowers per-iteration bindings for Hermes.

To verify that Hermes can compile the result:

```bash
EXPO_DIR=$(cd ../../../.. && pwd)
HERMESC=$(find "$EXPO_DIR/node_modules/.pnpm" -name hermesc -path '*osx-bin*' | head -1)
"$HERMESC" -emit-binary -out /tmp/device-transformer.hbc \
  "$EXPO_DIR/apps/expo-go/tools/device-transformer/dist/device-transformer-slim.min.js"
```
