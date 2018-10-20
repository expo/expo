# Expo Module Scripts

This package contains a collection of common scripts for all Expo modules and the Expo SDK package. This sets us up to have a consistent way of compiling JS, testing, linting, and other common tasks so that the Expo SDK is coherent and unified. Knowledge and experience from working on an Expo module in this repository will carry over to working on other modules. And ultimately, we want the development experience for Expo developers to be similar across modules. A structurally unified way of developing Expo modules helps us achieve these goals.

**This is the package that installs Babel CLI, TypeScript, Jest, and other common development dependencies.** Update the dependencies in this package when changing them for the Expo repository.

## Commands

This package defines a program called `expo-module` that accepts a command (ex: `expo-module build`). This allows us to add more commands without changing the behavior of existing commands while not needing to define more programs. Typically, you'd invoke these commands from Yarn:

```sh
$ cd expo-example-module
$ yarn expo-module test

# For commonly run commands, add "expo-module test" as an npm script named "test"
$ yarn test
```

For scripts that need to run as part of the npm lifecycle, you'd invoke the commands from npm scripts in package.json:

```json
{
  "scripts": {
    "prepare": "expo-module prepare",
    "prepublishOnly": "expo-module prepublishOnly",
  }
}
```

These are the commands:

### typecheck

This type checks the source TypeScript with `tsc`. This command is separate from `build` and does not emit compiled JS.

### build

This compiles the source JS or TypeScript to "compiled" JS that Expo can load. We use `tsc` instead of the Babel TypeScript plugin since `tsc` has complete support for the TypeScript language, while the Babel plugin has [some limitations](https://blogs.msdn.microsoft.com/typescript/2018/08/27/typescript-and-babel-7/). `tsc` also performs type checking in the same way that VS Code and other IDEs do.

If we wished to switch to using just Babel with the TypeScript plugin, this package would let us change the implementation of the `build` command and apply it to all packages automatically.

### test

We run tests using Jest with ts-jest, which runs TypeScript and Babel. This setup type checks test files and mimics the `build` command's approach of running `tsc` followed by Babel.

If we were to use just Babel with the TypeScript plugin for the `build` command, Jest with `babel-jest` would be more closely aligned.

### lint

This is not yet implemented. We need to see in practice how using ESLint with a TypeScript plugin would work for us compared to TSLint.

### clean

This deletes the build directory.

## Lifecycle Commands

These are commands to run as part of [the npm scripts lifecycle](https://docs.npmjs.com/misc/scripts).

### prepare (npm lifecycle)

Runs `clean` and `build`.

### prepublishOnly (npm lifecycle)

Runs `npm-proofread`, which ensures a [dist-tag](https://docs.npmjs.com/cli/dist-tag) is specified when publishing a prerelease version.

## Unified dependencies

This package depends on common development dependencies like Babel and Jest. The commands for compiling and testing JS need these dependencies, and the most important benefit is that all Expo module packages use the same version of Babel, Jest, their various plugins, and other development dependencies. This does remove the flexibility to customize the dependency versions for each module. We intentionally make this tradeoff to prioritize Expo as a whole over individual modules.
