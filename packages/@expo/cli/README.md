<!-- Title -->

<p align="center">
  <a href="https://expo.dev/">
    <img alt="Expo CLI" src="../../../.github/resources/cli-banner.svg">
  </a>
</p>

<p align="center">The fastest way to build and run universal React Native apps for iOS, Android, and the web</p>

<p align="center">

  <a aria-label="Join the Expo Discord" href="https://discord.gg/4gtbPAdpaE" target="_blank">
    <img alt="Discord" src="https://img.shields.io/discord/695411232856997968.svg?style=flat-square&labelColor=000000&color=000000&logo=discord&logoColor=FFFFFF&label=" />
  </a>
  <a aria-label="Browse the Expo forums" href="https://forums.expo.dev" target="_blank">
    <img alt="" src="https://img.shields.io/badge/Ask%20Questions%20-000.svg?style=flat-square&logo=discourse&logoWidth=15&labelColor=000000&color=000000">
  </a>

</p>

<p align="center">
  <a aria-label="expo documentation" href="https://docs.expo.dev/more/expo-cli/">📚 Read the Documentation</a>
  |
  <a aria-label="Contribute to Expo CLI" href="#contributing"><b>Contribute to Expo CLI</b></a>
</p>

<p>
  <a aria-label="Follow @expo on Twitter" href="https://twitter.com/intent/follow?screen_name=expo" target="_blank">
    <img  alt="Twitter: expo" src="https://img.shields.io/twitter/follow/expo.svg?style=flat-square&label=Follow%20%40expo&logo=TWITTER&logoColor=FFFFFF&labelColor=00aced&logoWidth=15&color=lightgray" target="_blank" />
  </a>
  <a aria-label="Follow Expo on Medium" href="https://blog.expo.dev">
    <img align="right" alt="Medium: exposition" src="https://img.shields.io/badge/Learn%20more%20on%20our%20blog-lightgray.svg?style=flat-square" target="_blank" />
  </a>
</p>

---

The `@expo/cli` package is a CLI binary that should be used via `expo` like `npx expo start`.

```
npx expo
```

> ⭐️ Be sure to star the Expo GitHub repo if you enjoy using the project!

## Design

This CLI has the following purposes:

- Be a minimal interface for starting a local development server that emulates a production EAS Updates server. The development server is the proxy between a native runtime (Expo Go, Dev Client) and a JS Bundler (Metro, Webpack).
  - To accomplish secure manifest signing (think https/TSL/SSL for web (required for sandboxing AsyncStorage, Permissions, etc.)) we need an authenticated Expo user account. This is the only reason we include the authentication commands `login`, `logout`, `whoami`, `register`. Standard web CLIs don't have authentication commands because they either don't set up https or they use emulation via packages like `devcert`.
- Orchestrating various native tools like Xcode, `Simulator.app`, Android Studio, ADB, etc. to make native builds as painless as possible. `run:ios`, `run:android` commands.
- Implementing a versioned `prebuild` command that can reliably work with a project for long periods of time. Prebuild is like a bundler for native code, it generates the `ios`, `android` folders based on the project Expo config (`app.json`).
  - `npx expo config` is auxiliary to `npx expo prebuild` and used for debugging/introspection.
- Installing versioned libraries with `npx expo install` this is a minimal utility born out of pure necessity since versioning in React Native is hard to get right.

# Contributing

To develop the CLI run (defaults to watch mode):

```
yarn build
```

We highly recommend setting up an alias for the Expo CLI so you can try it in projects all around your computer. Open your `.zshrc` or other config file and add:

```
alias nexpo="/path/to/expo/packages/@expo/cli/build/bin/cli"
```

Then use it with `nexpo` like `nexpo config`. You can also set up a debug version:

```
alias expo-inspect="node --inspect /path/to/expo/packages/@expo/cli/build/bin/cli"
```

Then you can run it and visit `chrome://inspect/#devices` in Chrome, and press "Open dedicated DevTools for Node" to get a debugger attached to your process. When debugging the CLI, you'll want to disable workers whenever possible, this will make all code run on the same thread, this is mostly applicable to the `start` command, i.e. `expo-inspect start --max-workers 0`.

## Format

- Be sure to update the [`CHANGELOG.md`](./CHANGELOG.md) with changes for every PR. You only need to add the message, our GitHub bot will automatically suggest adding your name and PR number to the diff.
- End `async` functions with `Async` like `runAsync`. This is just how we format functions at Expo.
- When throwing errors, always opt for `CommandError` instead of `Error` -- this helps with debugging and making the experience feel more coherent.
- Utilize the unified `Log` module instead of `console.log`.
- When logging with variables, utilize the following format `Something happened (foo: bar, baz: foz)`.
  - Avoid other formats like `Something happened: bar, foz` or `Something happened: foo=bar, baz=foz`.
- Main UI components like command names (`expo start`), arguments (`--port`), and `--help` messages should be modified internally, by the Expo team to ensure the developer experience is unified across Expo tooling. External contributions modifying these core aspects may be rejected.
- Use the `profile` utility method with the `EXPO_PROFILE=1` environment variable to measure execution time.
- Avoid globals and singletons as these make testing harder and less predictable. The only global we have (at the time of writing this) is the `isOffline` boolean.

## Environment

- Always be cautious of the transitive size of dependencies. [packagephobia](https://packagephobia.now.sh/) is a great resource for determining if a package is lean. Try to minimize adding dependencies to the CLI.
- We build the CLI using `taskr` + `swc`, this is partially inspired by Next.js' local CLI.
- The build pipeline will inline the CLI version as an environment variable that is accessible anywhere in the CLI codebase. You can access it via `process.env.__EXPO_VERSION` instead of reading the local `package.json` at runtime.
- Unlike the legacy global Expo CLI, this CLI is shipped with `expo` meaning the SDK Version is always present.
  - Reduce SDK specific tasks since only one SDK should be accounted for in a single version of `@expo/cli`.
  - The `@expo/config` method `getConfig` does not need the `skipSDKVersionRequirement` in any case since `expo` should always be installed. Ex: `getConfig('...', { skipSDKVersionRequirement: true });` shouldn't be used.
- Also unlike the global Expo CLI we can assume that node modules are always installed since this CLI should be used via a project's local `node_modules` folder.
  - This means we can't perform operations that upgrade the `expo` package as these may kill the running process. Features that need this pattern (like `expo upgrade`) should live in standalone global tools.

## Testing

There are two testing scripts:

- `yarn test`: Controlled unit and integration tests.
- `yarn test:e2e`: End to end testing for CLI commands. This requires the files to be built with `yarn build`

---

- You can target a specific set of tests with the `--watch` flag. Example: `yarn test --watch config`.
- We use backticks for `it` blocks. Example <code>it(`works`)</code>.
- If a pull request is fully self-contained to the `packages/@expo/cli/` folder (i.e. no `yarn.lock` modifications, etc.) then most native CI tests will be skipped, making CI pass faster in PRs.

### Unit Testing Guidelines

- Use `nock` for network requests.
- No top level `describe` blocks that wrap all the tests in a file.
- When testing a function, pass the function to the `describe` block instead of a stringified function name:
  - `describe(foobar, () => {})` instead of `describe('foobar', () => {})`
- Use virtual `fs` via `memfs` whenever possible.
- We have a lot of global module [**mocks**](./e2e/setup.ts) already in place, consider them when writing tests.
- GitHub Copilot can make writing tests a little less tedious.

### E2E Testing Guidelines

- E2E tests should be resilient and reliable, be sure to give them plenty of time for network requests.
- When testing locally you should attempt to reuse node modules for faster results. In the `npx expo prebuild` and `npx expo start` commands for instance, we utilize a helper method that will default to reusing a project + node_modules when run locally. This can be [toggled off](https://github.com/expo/expo/blob/11a5a4d27b7e1c8e4d6ddf0401397d789d89f52a/packages/%40expo/cli/e2e/__tests__/utils.ts#L174) to bootstrap a fresh project every time.
- When bootstrapping test projects, utilize the temporary folder `os.tmpdir()` as this folder is automatically cleaned up when the computer restarts.

## Coming from Expo CLI

> TL;DR: `expo-cli` was 'make it work', whereas `@expo/cli` is 'make it right, make it fast'.

The legacy global `expo-cli` package was deprecated in favor of this versioned `@expo/cli` package for the following reasons:

- `expo-cli` was too big and took way too long to install. This made CI frustrating to set up since you needed to also target global node modules for caching.
- `expo-cli` worked for almost all versions of the `expo` package, meaning it was getting more complex with every release.
- `expo-cli` combined service commands (like the legacy `build`, `submit`, `publish`) with project-level commands like `expo start`. We've since divided services into `eas-cli` and project commands into `npx expo` (`@expo/cli`). This structure is more optimal/faster for developers since they can install/update commands when they need them.
- This CLI utilizes more Node.js standard features like `$EDITOR` instead of the custom `$EXPO_EDITOR` environment variable. Also transitioning away from `$EXPO_DEBUG` and more towards `$DEBUG=expo:*`. These types of changes make Expo CLI play nicer with existing tooling.
- The DevTools UI has been deprecated to reduce the net install size, minimize complexity, and make room for future debugging UIs (Hermes/v8 Chrome debugger).
- The `expo start:web` and `expo web` commands have been rolled into `npx expo start` as we now lazily load platforms until the device requests them.
- Other missing or beta features from `expo-cli` may still be getting migrated over to this new CLI. For a more comprehensive breakdown see the [start command PR](https://github.com/expo/expo/pull/16160).
