# Expo Module Development Guide

> **Warning:** This doc is outdated and will be updated soon.

- [Generating a new module using `expo-cli` command](#generating-a-new-module-using-expo-cli-command)
- [The Standard Configuration](#the-standard-configuration)
  - [npm Scripts](#npm-scripts)
  - [Auto-generated Configuration Files](#auto-generated-configuration-files)
  - [Directory Structure](#directory-structure)
  - [Compiling TypeScript](#compiling-typescript)
  - [Fast Unit Tests](#fast-unit-tests)
- [package.json Fields](#packagejson-fields)

This guide explains the standard configuration and tools for working on modules in this repository. One of our goals is to write a coherent, high-quality SDK that is consistent across APIs and stays reliable in a way that is sustainable for the Expo team. Another goal is to reuse knowledge from working on one module and apply it to others by reducing disparity and fragmentation between modules. Expo has many modules and we need to keep Expo and working on Expo simple.

# Generating a new module using `expo-cli` command

`expo-cli` has specific command that would generate module that support TypeScript!
Run:

- `expo generate-module [new module directory]`
  - optional `[new module directory]` parameter lets you specify module name (e.g. `expo generate-module expo-test-module` would create `expo-test-module`. If ommited, the script will prompt you about it.
  - optional `--template <template directory>` will try to use provided `<template directory>` in module creation.

# The Standard Configuration

We use a shared set of configuration files and tools like TypeScript across modules. The `expo-module-scripts` package is the source of truth for much of the configuration. With Yarn workspaces, all modules use the same version of `expo-module-scripts`, helping us structurally ensure we use the same configuration across modules and uniformly use the same versions of Babel, TypeScript, Jest, and other tools.

In a module, include `expo-module-scripts` as a development dependency in package.json:

```json
{
  "devDependencies": {
    "expo-module-scripts": "^<latest version>"
  }
}
```

## npm Scripts

`expo-module-scripts` also defines several scripts that are useful during development or should run during the [npm lifecycle](https://docs.npmjs.com/misc/scripts). Define these common scripts in package.json:

```json
{
  "scripts": {
    "build": "expo-module build",
    "clean": "expo-module clean",
    "lint": "expo-module lint",
    "test": "expo-module test",
    "postinstall": "expo-module postinstall",
    "prepare": "expo-module prepare",
    "prepublishOnly": "expo-module prepublishOnly",
    "expo-module": "expo-module"
  }
}
```

The `expo-module` program is provided by `expo-module-scripts`. You can run `yarn expo-module --help` to see all of the commands. Several of the scripts are interactive and start file watchers as they are intended for human developers rather than CI. To run the commands in non-interactive mode, set the environment variable `EXPO_NONINTERACTIVE=1`.

## Auto-generated Configuration Files

The `postinstall` script auto-generates configuration files in the package when necessary. For example, Babel looks for its configuration files in the package's directory. Commit these files to Git so we can track changes to these files. This also makes it possible to manually edit and commit those files if necessary.

## Directory Structure

`expo-module-scripts` expects modules to be written in TypeScript under a directory named `src` and will compile the modules to a directory named `build`. **In a module package, commit the `build` directory to Git.** Only the people working on a module need to compile it instead of everyone needing to run `tsc` in each package whenever their local Git repository changes.

In package.json, define the main module of the package to be the compiled entry point under `build`:

```json
{
  "main": "build/ExampleModule.js"
}
```

Running `yarn clean` will delete the `build` directory.

## Compiling TypeScript

Run `yarn build` to compile the source code. This command starts a file watcher and compiles source files as they are edited and saved. You can also run `yarn expo-module tsc` to run `tsc` directly.

The `postinstall` script generates a small tsconfig.json file that extends the main configuration file inside of `expo-module-scripts`.

## Fast Unit Tests

`expo-module-scripts` also defines a Jest preset. Add a Jest configuration section to package.json:

```json
{
  "jest": {
    "preset": "expo-module-scripts"
  }
}
```

This preset enables TypeScript support with `ts-jest`. It creates a custom tsconfig.json file for Jest tests and configures Jest to run both TypeScript and Babel with `babel-preset-expo` so we more accurately transform the code as if it were part of an app.

Run `yarn test` to run Jest in watcher mode. By default, Jest will run tests affected by changed files and re-run tests when files are edited and saved. Since the unit tests run every time a file changes, we need to keep these tests fast and deterministic.

# package.json Fields

Inside of package.json, set the repository and bugs URLs to the Expo repository. For the homepage URL, link to the source of the module.

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/expo/expo.git"
  },
  "author": "Expo",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/expo/expo/issues"
  },
  "homepage": "https://github.com/expo/expo/tree/main/packages/expo-sms"
}
```
