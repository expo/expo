# Expo Module Scripts

This package contains a collection of common scripts for all Expo modules and the Expo SDK package. This sets us up to have a consistent way of compiling JS, testing, linting, and other common tasks so that the Expo SDK is coherent and unified. Knowledge and experience from working on an Expo module in this repository will carry over to working on other modules. And ultimately, we want the development experience for Expo developers to be similar across modules. A structurally unified way of developing Expo modules helps us achieve these goals.

**This is the package that installs Babel CLI, TypeScript, Jest, and other common development dependencies.** Update the dependencies in this package when changing them for the Expo repository.

- [Getting Started](#getting-started)
- [Setup](#setup)
  - [🔌 Config Plugin](#-config-plugin)
  - [🤡 Jest](#-jest)
  - [📝 LICENSE](#-license)
  - [Side Effects](#side-effects)
  - [Entry Point and Types](#entry-point-and-types)
  - [🔗 npm Linking](#-npm-linking)
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
- [Excluding Files from npm](#excluding-files-from-npm)
- [Unified Dependencies](#unified-dependencies)

## Getting Started

```sh
yarn add -D expo-module-scripts

# or

npm install --save-dev expo-module-scripts
```

## Setup

Add the following scripts to your `package.json` and run `yarn`

```json
{
  "scripts": {
    "build": "expo-module build",
    "clean": "expo-module clean",
    "test": "expo-module test",
    "prepare": "expo-module prepare",
    "prepublishOnly": "expo-module prepublishOnly",
    "expo-module": "expo-module"
  }
}
```

Running `yarn` will now run the `prepare` script, which generates any missing files:

- [`.eslintrc.js`](./templates/.eslintrc.js) ([docs](https://eslint.org/docs/user-guide/configuring)) this extends [`eslint-config-universe`](https://github.com/expo/expo/tree/main/packages/eslint-config-universe).
  - Optionally you can customize Prettier too: [.prettierrc guide](https://github.com/expo/expo/tree/main/packages/eslint-config-universe#customizing-prettier).
- [`.npmignore`](./templates/.npmignore) ([docs](https://docs.npmjs.com/misc/developers)) currently only ignores the `babel.config.js` in your module. You might also want to also add tests and docs.
  - Expo modules use `.npmignore` **instead of** the `files` field in the `package.json`.
  - (Pro Tip) Test which files get packaged by running `npm pack`. If you see files that aren't crucial to running the module, you should add them to `.npmignore`.
- [`README.md`](./templates/README.md) A default template for Unimodule installation.
  - Project docs should try to have relevant emojis in headers because OSS is fun.
  - Use [badges](https://github.com/expo/expo#-badges)
  - Try and incorporate a table of contents (TOC).
- [`tsconfig.json`](./templates/tsconfig.json) ([docs](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)) extends [`tsconfig.base.json`](./tsconfig.base.json) this is important for ensuring all Unimodules use the same version of TypeScript.

Besides, running `yarn prepare` script will also synchronize optional files from `expo-module-scripts` when the file is present and contains the `@generated` pattern:

- [`with-node.sh`](./templates/scripts/with-node.sh): An Xcode build phase script helper for Node.js binary resolution. It sources the project's **.xcode.env** and **.xcode.env.local** files, which may define an environment variable named `NODE_BINARY` to specify the file path of the Node.js binary to run.

### 🔌 Config Plugin

To create a [config plugin](https://github.com/expo/expo/blob/main/packages/@expo/config-plugins/README.md) that automatically configures your native code, you have two options:

1. Create a `plugin` folder and write your plugin in TypeScript (recommended).
2. Create an `app.plugin.js` file in the project root and write the plugin in pure Node.js-compliant JavaScript.

Config plugins must be transpiled for compatibility with Node.js (LTS). The features supported in Node.js are slightly different from those in Expo or React Native modules, which support ES6 import/export keywords and JSX, for example. This means we'll need two different `tsconfig.json` files and two different `src` (and `build`) folders — one for the code that will execute in an Expo or React Native app and the other for the plugin that executes in Node.js.

This can quickly become complex, so we've created a system for easily targeting the plugin folder.

#### Plugin setup

The following files are required for a TypeScript plugin:

```
╭── app.plugin.js ➡️ Entry file
╰── plugin/ ➡️ All code related to the plugin
    ├── __tests__/ ➡️ Optional: Folder for tests related to the plugin
    ├── tsconfig.json ➡️ The TypeScript config for transpiling the plugin to JavaScript
    ├── jest.config.js ➡️ Optional: The Jest preset
    ╰── src/index.ts ➡️ The TypeScript entry point for your plugin
```

Create an `app.plugin.js` (the entry point for a config plugin):

```js
module.exports = require('./plugin/build');
```

Create a `plugin/tsconfig.json` file. Notice that this uses `tsconfig.plugin` as the base config:

```json
{
  "extends": "expo-module-scripts/tsconfig.plugin",
  "compilerOptions": {
    "outDir": "build",
    "rootDir": "src"
  },
  "include": ["./src"],
  "exclude": ["**/__mocks__/*", "**/__tests__/*"]
}
```

In your `plugin/src/index.ts` file, write your TypeScript config plugin:

```ts
import { ConfigPlugin } from '@expo/config-plugins';

const withNewName: ConfigPlugin<{ name?: string }> = (config, { name = 'my-app' } = {}) => {
  config.name = name;
  return config;
};

export default withNewName;
```

> 💡 Tip: Using named functions makes debugging easier with `EXPO_DEBUG=true`

Optionally, you can add `plugin/jest.config.js` to override the default project Jest preset.

```ts
module.exports = require('expo-module-scripts/jest-preset-plugin');
```

Use the following scripts to interact with the plugin:

- `yarn build plugin`: Build the plugin.
- `yarn clean plugin`: Delete the `plugin/build` folder.
- `yarn lint plugin`: Lint the `plugin/src` folder.
- `yarn test plugin`: Alias for `npx jest --rootDir ./plugin --config ./plugin/jest.config.js`, uses the project's Jest preset if `plugin/jest.config.js` doesn't exist.
- `yarn prepare`: Prepare the plugin and module for publishing.

### 🤡 Jest

The Jest preset extends [`jest-expo`](https://github.com/expo/expo/tree/main/packages/jest-expo) and adds proper TypeScript support and type declarations to the presets.

**For unit testing API-based modules:**

```json
{
  "jest": {
    "preset": "expo-module-scripts"
  }
}
```

**For unit testing component-based modules** use @testing-library/react and @testing-library/react-native.

### 📝 LICENSE

This makes it easier for other members of the community to work with your package. Expo usually has the **MIT** license.

```json
{
  "license": "MIT"
}
```

### Side Effects

The [`@expo/webpack-config`](https://www.npmjs.com/package/@expo/webpack-config) is optimized for tree-shaking, you should always make sure to list whatever files in your module have side effects. In Expo modules we use the `.fx.*` extension on these files (this makes it easier to target them with `sideEffects`).

[**Learn more about side effects**](https://webpack.js.org/guides/tree-shaking/)

```json
{
  "sideEffects": false
}
```

### Entry Point and Types

We recommend you name the initial file after the module for easier searching. Be sure to define the `types` file as well.

> 💡 Note that the `"typings"` field is synonymous with `"types"` field, Expo uses the TypeScript preferred `"types"` field.

[**Learn more about "types" field**](https://webpack.js.org/guides/tree-shaking/)

```json
{
  "main": "build/Camera.js",
  "types": "build/Camera.d.ts"
}
```

> 💡 You technically don't need to define the types file if it's named the same as the `main` file but Expo modules always define it (which is what TypeScript recommends).

### 🔗 npm Linking

Make your package accessible to npm users by adding the following fields:

Expo modules use the long form object when possible to better accommodate monorepos and hyperlinks:

- [homepage docs](https://docs.npmjs.com/files/package.json#homepage)
- [bugs docs](https://docs.npmjs.com/files/package.json#bugs)
- [repository docs](https://docs.npmjs.com/files/package.json#repository)

```json
{
  "homepage": "https://github.com/YOU/expo-YOUR_PACKAGE#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/YOU/expo-YOUR_PACKAGE.git"
  },
  "bugs": {
    "url": "https://github.com/YOU/expo-YOUR_PACKAGE/issues"
  }
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
    "prepublishOnly": "expo-module prepublishOnly"
  }
}
```

These are the commands:

### configure

This generates common configuration files like `tsconfig.json` for the package. These auto-generated files are meant to be read-only and committed to Git.

### typecheck

This type checks the source TypeScript with `tsc`. This command is separate from `build` and does not emit compiled JS.

### build

This compiles the source JS or TypeScript to "compiled" JS that Expo can load. We use `tsc` instead of the Babel TypeScript plugin since `tsc` has complete support for the TypeScript language, while the Babel plugin has [some limitations](https://blogs.msdn.microsoft.com/typescript/2018/08/27/typescript-and-babel-7/). `tsc` also performs type checking in the same way that VS Code and other IDEs do.

If we wished to switch to using just Babel with the TypeScript plugin, this package would let us change the implementation of the `build` command and apply it to all packages automatically.

#### build plugin

Running `build plugin` builds the plugin source code in `plugin/src`.

### test

We run tests using Jest with ts-jest, which runs TypeScript and Babel. This setup type checks test files and mimics the `build` command's approach of running `tsc` followed by Babel.

If we were to use just Babel with the TypeScript plugin for the `build` command, Jest with `babel-jest` would be more closely aligned.

### lint

This runs ESLint over the source JS and TypeScript files.

One of the rules enforced is restricting any imports from the `fbjs` library. As stated in that [library's readme](https://github.com/facebook/fbjs#purpose):

> If you are consuming the code here and you are not also a Facebook project, be prepared for a bad time.

Replacements for common `fbjs` uses-cases are listed below:

- `invariant`- replace with [`invariant`](https://www.npmjs.com/package/invariant)
- `ExecutionEnvironment`- replace with [`Platform` from `@unimodules/core`](https://github.com/expo/expo/blob/main/packages/%40unimodules/react-native-adapter/src/Platform.ts)

#### lint plugin

Running `lint plugin` will lints the plugin source code in `plugin/src`.

### clean

This deletes the build directory.

#### clean plugin

Running `clean plugin` will delete the `plugin/build` directory.

## Lifecycle Commands

These are commands to run as part of [the npm scripts lifecycle](https://docs.npmjs.com/misc/scripts).

### prepare (npm lifecycle)

Runs `clean` and `build`.

### prepublishOnly (npm lifecycle)

Runs `npm-proofread`, which ensures a [dist-tag](https://docs.npmjs.com/cli/dist-tag) is specified when publishing a prerelease version.

## Excluding Files from npm

By convention, `expo-module-scripts` uses `.npmignore` to exclude all top-level hidden directories (directories starting with `.`) from being published to npm. This behavior is useful for files that need to be in the Git repository but not in the npm package.

## Unified Dependencies

This package depends on common development dependencies like Babel and Jest. The commands for compiling and testing JS need these dependencies, and the most important benefit is that all Expo module packages use the same version of Babel, Jest, their various plugins, and other development dependencies. This does remove the flexibility to customize the dependency versions for each module. We intentionally make this tradeoff to prioritize Expo as a whole over individual modules.
