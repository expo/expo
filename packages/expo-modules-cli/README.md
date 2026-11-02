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

A command with a language prefix, such as `swift:`, uses the tools of that language and reads only its sources. A command without a prefix gives a result that doesn't depend on the native language.

### `expo-modules generate-types [packageDir]`

Generates TypeScript types for the native API an Expo module exports to JavaScript. It scans the package's Swift sources for `@ExpoModule`, `@SharedObject`, `@Record`, and `@Union` types annotated with the Expo Modules macros, and for `Enumerable` enums, and writes them to one TypeScript file per package, `src/native.types.ts` by default, which the package compiles along with its other sources. Modules extend `NativeModule` and shared objects extend `SharedObject`, both imported from `expo`. The `@Event` declarations of a class become an exported `<Name>Events` type passed to its base class, the same shape hand-written modules use. A shared object without a `@JS init` gets a private constructor, since only native code creates its instances. `Enumerable` enums become TS enums with the Swift case names and raw values, and `@Union` types the union of their member types. A type nested in another type is declared under its own name, without the names of the types around it (`Encoding` for `DigestOptions.Encoding`). The command leaves the file untouched when it already holds the generated content, only replaces a file that starts with its own header, so it never overwrites a hand-written file, and removes such a file when the package no longer exports anything.

```sh
expo-modules generate-types packages/expo-video
```

Write the doc comments of the API in the generated file. On each run, the command reads the block comments (`/** ... */`) above each declaration and member, and writes each one back above the declaration or member with the same TypeScript name. A comment stays with its declaration when the declaration moves. An overload keeps its comment while its signature stays the same. The other overloads of a function match in order. New declarations get no comment. A file whose only changes are doc comments is still up to date for `--check` when each comment is directly above its declaration, at the same indentation. The command writes each comment in that place, so a file with comments placed differently, or one that a formatter changed, is out of date until the next run.

The command prints a warning in three cases:

- A declaration with a comment is no longer generated, for example because it was removed or renamed. The command drops the comment and prints its text below the warning. If the declaration was renamed, add the comment to the new name.
- A comment is not above any declaration or member, for example because it is inside a parameter list, at the end of a body, or after code on the same line. The command drops the comment and prints its text below the warning.
- A member or one-line declaration with a comment changed. The command keeps the comment and warns on that run only, so check that the comment still describes the declaration.

The scanner is a macOS binary, so this command runs on macOS only. Support for Linux is planned.

The command scans with the `expo-modules-macros` version that the package's `expo-modules-core` depends on, the same version the iOS build compiles the macros with. It finds that version through the `expo` package, so `expo` must be installed in the package, which every Expo module has as a peer dependency.

Options:

- `-o, --out <path>`: the TypeScript file to write, relative to the package directory. Defaults to `src/native.types.ts`.
- `--scanner <path>`: path to the Expo Modules scanner executable. Defaults to the scanner that ships with the `expo-modules-macros` version that `expo-modules-core` depends on.
- `--check`: verify that the file is up to date without writing it. Exits with code 1 when the file is missing, outdated, or no longer needed, so a CI job can catch a stale committed file.

After writing, the command lists every declaration with its kind, TypeScript name, and the Swift file it came from, grouped by file. A Swift type the scanner cannot express in TypeScript renders as `unknown`, and the command prints a warning naming the Swift file and member so the gap is visible.

The scan skips `node_modules`, `Pods`, `.build`, and `.git`, and also test and example directories (`Tests`, `UITests`, `__tests__`, `__mocks__`, `example`, `examples`, `e2e`), whose sources are not part of the package's product. A package that only declares modules in such directories, like the test fixtures in `expo-modules-core`, therefore generates nothing.

### `expo-modules swift:expand <path...>`

Prints the code that the Expo Modules macros generate for Swift sources, as "Expand Macro" does in Xcode, but in a terminal and without a build. A path is a `.swift` file or a directory. In a directory, only the files that use one of the macros are expanded, and the same directories as in `generate-types` are skipped. The command prints the expanded source to stdout and the macro diagnostics to stderr, in the compiler's `<file>:<line>:<column>: error: <message>` format. It exits with code 1 when there is an error.

```sh
expo-modules swift:expand ios/HapticsModule.swift
expo-modules swift:expand --symbol HapticsModule.impactAsync ios/HapticsModule.swift
```

`--symbol` limits the output to one declaration. A type (`HapticsModule`, `HapticsModule.ImpactStyle`) prints the expanded type and the extensions that its macros add. A member (`HapticsModule.impactAsync`) prints its type with only that member, so the generated code is the code for that member.

The macros read only the syntax tree, so the expansion is what the compiler gets. Two things can differ: the names that a macro makes unique, and the conformances that a type inherits from somewhere else. Errors that need type checking still need a build.

### `expo-modules swift:check [path...]`

Checks Swift sources for the errors and warnings of the Expo Modules macros, without a build. It takes the same paths as `swift:expand`, and checks the current directory when there is none. It prints only the diagnostics and a summary, and exits with code 1 when there is an error, so a CI job or a coding agent can check a module before an Xcode build.

```sh
expo-modules swift:check
expo-modules swift:check --symbol HapticsModule.impactAsync ios
```

Both commands use the `expo-modules-macros` version that the package's `expo-modules-core` depends on, as `generate-types` does, and need version 0.27.0 or later. They find it from the first path.

Options of both commands:

- `--symbol <name>`: only a type or a member, and only its diagnostics. Repeatable.
- `--json`: print a JSON report with the expansions and diagnostics instead of text. The exit code is then 0 also when there is an error.
- `--scanner <path>`: path to the Expo Modules executable. Defaults to the one that ships with the `expo-modules-macros` version that `expo-modules-core` depends on.

## Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
