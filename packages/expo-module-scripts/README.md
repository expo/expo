# Expo Module Scripts

This package contains a collection of common scripts for all Expo modules and the Expo SDK package. This sets us up to have a consistent way of compiling JS, testing, linting, and other common tasks so that the Expo SDK is coherent and unified. Knowledge and experience from working on an Expo module in this repository will carry over to working on other modules. And ultimately, we want the development experience for Expo developers to be similar across modules. A structurally unified way of developing Expo modules helps us achieve these goals.

**This is the package that installs Babel CLI, TypeScript, Jest, and other common development dependencies.** Update the dependencies in this package when changing them for the Expo repository.

- [Getting Started](#getting-started)
- [Setup](#setup)
  - [🤡 Jest](#-jest)
  - [📝 LICENSE](#-license)
  - [Side Effects](#side-effects)
  - [Entry Point and Types](#entry-point-and-types)
  - [🔗 NPM Linking](#-npm-linking)
- [⌘ Commands](#-commands)
  - [configure](#configure)
  - [typecheck](#typecheck)
  - [build](#build)
  - [test](#test)
  - [lint](#lint)
  - [clean](#clean)
- [Lifecycle Commands](#lifecycle-commands)
  - [prepare (npm lifecycle)](#prepare--npm-lifecycle-)
  - [prepublishOnly (npm lifecycle)](#prepublishonly--npm-lifecycle-)
- [Unified dependencies](#unified-dependencies)

## Getting Started

```sh
yarn add -D expo-module-scripts

# or

npm install --save-dev expo-module-scripts
```

## Setup

Add the following scripts to your `package.json` and run `yarn`

```json5
{ 
  "scripts": {
      "build": "expo-module build",
      "clean": "expo-module clean",
      "test": "expo-module test",
      "prepare": "expo-module prepare",
      "prepublishOnly": "expo-module prepublishOnly",
      "expo-module": "expo-module"
  },
}
```

Running `yarn` will now run the `prepare` script, which generates any missing files:
- [`.eslintrc.js`](./templates/.eslintrc.js) ([docs](https://eslint.org/docs/user-guide/configuring)) this extends [`eslint-config-universe`](https://github.com/expo/expo/tree/master/packages/eslint-config-universe).
  - Optionally you can customize Prettier too: [.prettierrc guide](https://github.com/expo/expo/tree/master/packages/eslint-config-universe#customizing-prettier).
- [`.npmignore`](./templates/.npmignore) ([docs](https://docs.npmjs.com/misc/developers)) currently only ignores the `babel.config.js` in your module. You might also want to also add tests and docs.
  - Expo modules use `.npmignore` **instead of** the `files` field in the `package.json`.
  - (Pro Tip) Test which files get packaged by running `npm pack`. If you see files that aren't crucial to running the module, you should add them to `.npmignore`.
- [`README.md`](./templates/README.md) A default template for Unimodule installation.
  - Project docs should try to have relevant emojis in headers because OSS is fun.
  - Use [badges](https://github.com/expo/expo#-badges)
  - Try and incorporate a table of contents (TOC).
- [`tsconfig.json`](./templates/tsconfig.json) ([docs](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)) extends [`tsconfig.base.json`](./tsconfig.base.json) this is important for ensuring all Unimodules use the same version of TypeScript.

You should also add the following fields to your `package.json`:

### 🤡 Jest

The Jest preset extends [`jest-expo`](https://github.com/expo/expo/tree/master/packages/jest-expo) or [`jest-expo-enzyme`](https://github.com/expo/expo/tree/master/packages/jest-expo-enzyme) and adds proper TypeScript support and type declarations to the presets.

**For unit testing API-based modules:**

```json5
{
  "jest": {
    "preset": "expo-module-scripts/universal"
  },
}
```

**For unit testing component-based modules:**

```json5
{
  "jest": {
    "preset": "expo-module-scripts/enzyme"
  },
}
```

### 📝 LICENSE

This makes it easier for other members of the community to work with your package. Expo usually has the **MIT** license.

```json5
{
  "license": "MIT",
}
```

### Side Effects

The [`@expo/webpack-config`](https://www.npmjs.com/package/@expo/webpack-config) is optimized for tree-shaking, you should always make sure to list whatever files in your module have side effects. In Expo modules we use the `.fx.*` extension on these files (this makes it easier to target them with `sideEffects`).

[**Learn more about side effects**](https://webpack.js.org/guides/tree-shaking/)

```json5
{
  "sideEffects": false,
}
```

### Entry Point and Types

We recommend you name the initial file after the module for easier searching. Be sure to define the `types` file as well.

> 💡 Note that the `"typings"` field is synonymous with `"types"` field, Expo uses the TypeScript preferred `"types"` field.

[**Learn more about "types" field**](https://webpack.js.org/guides/tree-shaking/)

```json5
{
  "main": "build/Camera.js",
  "types": "build/Camera.d.ts",
}
```

> 💡 You technically don't need to define the types file if it's named the same as the `main` file but Expo modules always define it (which is what TypeScript recommends).

### 🔗 NPM Linking

Make your package accessible to NPM users by adding the following fields:

Expo modules use the long form object when possible to better accommodate monorepos and hyperlinks:

- [homepage docs](https://docs.npmjs.com/files/package.json#homepage)
- [bugs docs](https://docs.npmjs.com/files/package.json#bugs)
- [repository docs](https://docs.npmjs.com/files/package.json#repository)

```json5
{
  "homepage": "https://github.com/YOU/expo-YOUR_PACKAGE#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/YOU/expo-YOUR_PACKAGE.git"
  },
  "bugs": {
    "url": "https://github.com/YOU/expo-YOUR_PACKAGE/issues"
  },
}
```

## ⌘ Commands

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

### configure

This generates common configuration files like `tsonfig.json` for the package. These auto-generated files are meant to be read-only and committed to Git.

### typecheck

This type checks the source TypeScript with `tsc`. This command is separate from `build` and does not emit compiled JS.

### build

This compiles the source JS or TypeScript to "compiled" JS that Expo can load. We use `tsc` instead of the Babel TypeScript plugin since `tsc` has complete support for the TypeScript language, while the Babel plugin has [some limitations](https://blogs.msdn.microsoft.com/typescript/2018/08/27/typescript-and-babel-7/). `tsc` also performs type checking in the same way that VS Code and other IDEs do.

If we wished to switch to using just Babel with the TypeScript plugin, this package would let us change the implementation of the `build` command and apply it to all packages automatically.

### test

We run tests using Jest with ts-jest, which runs TypeScript and Babel. This setup type checks test files and mimics the `build` command's approach of running `tsc` followed by Babel.

If we were to use just Babel with the TypeScript plugin for the `build` command, Jest with `babel-jest` would be more closely aligned.

### lint

This runs ESLint over the source JS and TypeScript files.

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
