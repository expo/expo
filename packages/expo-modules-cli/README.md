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

Generates TypeScript types for the native API an Expo module exports to JavaScript. It scans the package's Swift sources for `@ExpoModule`, `@SharedObject`, `@Record`, and `@Union` types annotated with the Expo Modules macros, and for `Enumerable` enums, and writes them to one TypeScript file per package, `src/native.types.ts` by default, which the package compiles along with its other sources. Modules extend `NativeModule` and shared objects extend `SharedObject`, both imported from `expo`. The `@Event` declarations of a class become an exported `<Name>Events` type passed to its base class, the same shape hand-written modules use. A shared object without a `@JS init` gets a private constructor, since only native code creates its instances. `Enumerable` enums become TS enums with the Swift case names and raw values, and `@Union` types the union of their member types. The command leaves the file untouched when it already holds the generated content, only replaces a file that starts with its own header, so it never overwrites a hand-written file, and removes such a file when the package no longer exports anything.

```sh
expo-modules generate-types packages/expo-video
```

The scanner is a macOS binary, so this command runs on macOS only. Support for Linux is planned.

Options:

- `-o, --out <path>`: the TypeScript file to write, relative to the package directory. Defaults to `src/native.types.ts`.
- `--scanner <path>`: path to the Expo Modules scanner executable. Defaults to the scanner bundled with the CLI.
- `--check`: verify that the file is up to date without writing it. Exits with code 1 when the file is missing, outdated, or no longer needed, so a CI job can catch a stale committed file.

After writing, the command lists every declaration with its kind, TypeScript name, and the Swift file it came from, grouped by file. A Swift type the scanner cannot express in TypeScript renders as `unknown`, and the command prints a warning naming the Swift file and member so the gap is visible.

The scan skips `node_modules`, `Pods`, `.build`, and `.git`, and also test and example directories (`Tests`, `UITests`, `__tests__`, `__mocks__`, `example`, `examples`, `e2e`), whose sources are not part of the package's product. A package that only declares modules in such directories, like the test fixtures in `expo-modules-core`, therefore generates nothing.

## Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
