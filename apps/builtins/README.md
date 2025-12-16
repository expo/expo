# Built-ins for Expo Go standard runtime

- Add modules to `packages/@expo/cli/scripts/generate-builtins-manifest.js` in the `BUILTINS` array.
- Run `yarn generate-std-runtime` in `packages/@expo/cli` to regenerate the built-ins manifest.
- Run `yarn bundle` to create the built-in bundles and copy them to Expo Go / builtins-tester.
- Rebuild the native apps and run the dev server with `EXPO_USE_STD_RUNTIME=1` to enable aliases to the standard runtime where applicable.
