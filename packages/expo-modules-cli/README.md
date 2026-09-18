<p>
  <a href="https://docs.expo.dev/modules/">
    <img
      src="../../.github/resources/expo-modules-cli.svg"
      alt="expo-modules-cli"
      height="64" />
  </a>
</p>

Command-line tools for developing Expo modules, available as `expo-modules`.

## Commands

### `expo-modules generate-types [packageDir]`

Generates TypeScript types for the native API an Expo module exports to JavaScript. It scans the package's Swift sources for `@ExpoModule`, `@SharedObject`, `@Record`, and `@Union` types annotated with the Expo Modules macros, and for `Enumerable` enums, and writes them to one TypeScript file per package, `src/native.ts` by default, which the package compiles along with its other sources. Modules extend `NativeModule` and shared objects extend `SharedObject`, both imported from `expo`, with the `@Event` declarations of each as the events map of its base class. A shared object without a `@JS init` gets a private constructor, since only native code creates its instances. `Enumerable` enums become TS enums with the Swift case names and raw values, and `@Union` types the union of their member types. The command only replaces a file that starts with its own header, so it never overwrites a hand-written file, and it removes such a file when the package no longer exports anything.

```sh
expo-modules generate-types packages/expo-video
```

The scanner is a macOS binary, so this command runs on macOS only. Support for Linux is planned.

Options:

- `-o, --out <path>`: the TypeScript file to write, relative to the package directory. Defaults to `src/native.ts`.
- `--scanner <path>`: path to the Expo Modules scanner executable. Defaults to the scanner bundled with the CLI.

A Swift type the scanner cannot express in TypeScript renders as `unknown`, and the command prints a warning naming the Swift file and member so the gap is visible.

The scan skips `node_modules`, `Pods`, `.build`, and `.git`, and also test and example directories (`Tests`, `UITests`, `__tests__`, `__mocks__`, `example`, `examples`, `e2e`), whose sources are not part of the package's product. A package that only declares modules in such directories, like the test fixtures in `expo-modules-core`, therefore generates nothing.

## Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
