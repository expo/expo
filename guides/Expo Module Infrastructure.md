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
  - optional `[new module directory]` parameter lets you specify module name (e.g. `expo generate-module expo-test-module` would create `expo-test-module`. If omitted, the script will prompt you about it.
  - optional `--template <template directory>` will try to use provided `<template directory>` in module creation.

# The Standard Configuration

We use a shared set of configuration files and tools like TypeScript across modules. The `@expo/internal-scripts` package is the source of truth for much of the configuration. With pnpm workspaces, all modules use the in-repo version of `@expo/internal-scripts`, helping us structurally ensure we use the same configuration across modules and uniformly use the same versions of Babel, TypeScript, Jest, and other tools.

In a module, include `@expo/internal-scripts` as a development dependency in package.json:

```json
{
  "devDependencies": {
    "@expo/internal-scripts": "workspace:*"
  }
}
```

## npm Scripts

`@expo/internal-scripts` also defines several scripts that are useful during development or should run during the [npm lifecycle](https://docs.npmjs.com/misc/scripts). Define these common scripts in package.json:

```json
{
  "scripts": {
    "build": "expo-build src",
    "typecheck": "tsc -p tsconfig.json",
    "test": "jest",
    "clean": "expo-module clean",
    "lint": "oxlint --config oxlint.config.mjs .",
    "format": "expo-module format",
    "depscheck": "expo-module depscheck",
    "prepublishOnly": "expo-module prepublishOnly"
  }
}
```

The `expo-module` program is provided by `@expo/internal-scripts`. You can run `pnpm expo-module --help` to see all of the commands. Testing and type checking invoke Jest and TypeScript directly; pass `--watch` explicitly when needed.

## Auto-generated Configuration Files

Run `pnpm expo-module configure` manually from the package directory to generate shared configuration files. It creates missing files and refreshes files marked `@generated`; optional templates are refreshed only when the file already exists and is marked `@generated`. Commit the generated files to Git.

## Directory Structure

`@expo/internal-scripts` expects modules to be written in TypeScript under a directory named `src` and will compile the modules to a directory named `build`. **The `build` directory is not committed to Git** — it is in `.gitignore`. [Turborepo](https://turborepo.com/) compiles packages on demand and caches the output (locally and via a shared remote cache), so contributors don't need to rebuild every package whenever their local Git repository changes.

In package.json, define the main module of the package to be the compiled entry point under `build`:

```json
{
  "main": "build/ExampleModule.js"
}
```

Running `pnpm clean` will delete the `build` directory.

## Compiling TypeScript

Run `pnpm build` to compile the source code from `src` to `build`. Run `pnpm typecheck` to type-check the package with `tsc` without emitting output. When working across the monorepo, prefer running these through Turborepo from the repo root (`pnpm build`, `pnpm typecheck`) so only affected packages are rebuilt and results are cached.

The `configure` command generates a small tsconfig.json file extending `@expo/internal-scripts/tsconfig.base`, with `noEmit` enabled. `expo-build` handles build output separately.

## Fast Unit Tests

`@expo/internal-scripts` also defines a Jest preset. Add a Jest configuration section to package.json:

```json
{
  "jest": {
    "preset": "@expo/internal-scripts"
  }
}
```

This preset creates iOS, Android, web, and Node test projects using `jest-expo`. It enables the `expo-source` export condition so tests resolve workspace source files without requiring build outputs.

Run `pnpm test` to run Jest once, or `pnpm test --watch` to rerun affected tests when files change. Keep unit tests fast and deterministic.

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
