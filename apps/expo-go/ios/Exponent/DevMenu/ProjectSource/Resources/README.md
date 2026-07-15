# ProjectSource Resources

## device-transformer.js

Generated payload (~11 MB) — the on-device babel transpiler the source
explorer runs, in a standalone Hermes JSI runtime (`EXOnDeviceTransformer.mm`),
to transpile edited files for **published** projects. It bundles `@babel/core`
+ `babel-preset-expo` into one Hermes-safe script and exposes
`transformModule(source, filename, moduleId, depIds) -> { code, depNames }`.

**Do not edit by hand.** It's a build artifact, committed like
`Exponent/Supporting/SnackRuntime/snack-runtime.hbc`.

### Regenerating (on `@babel/core` / `babel-preset-expo` / SDK bumps)

The build tooling lives in this repo:

```bash
cd apps/expo-go/tools/device-transformer
node build-slim.js        # bundles + applies Hermes-safety passes, copies the
                          # payload back into this Resources/ dir
node baseline-slim.js     # Node fidelity check (expected depNames)
node test-extraction.js   # AST require-extraction + unsupported-construct refusal
```

`build-slim.js` copies the minified result here automatically. See the tool's
`README.md` for the three Hermes-safety passes and how to verify the payload
in a real Hermes VM.
