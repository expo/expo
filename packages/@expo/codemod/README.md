<!-- Title -->

<h1 align="center">@expo/codemod</h1>

<p align="center">CLI and jscodeshift codemods for migrating Expo apps between SDK versions</p>

<p align="center">
  <a aria-label="expo documentation" href="https://docs.expo.dev/router/introduction/">📚 Read the Documentation</a>
  &ensp;•&ensp;
  <a aria-label="expo blog" href="https://expo.dev/blog">Learn more on our blog</a>
  &ensp;•&ensp;
  <a aria-label="Contribute to @expo/codemod" href="#contributing">Contribute to @expo/codemod</a>
</p>

<p align="center">
  <a aria-label="Join the Expo Discord" href="https://discord.gg/4gtbPAdpaE" target="_blank">
    <img alt="Discord" src="https://img.shields.io/discord/695411232856997968.svg?style=for-the-badge&color=5865F2&logo=discord&logoColor=FFFFFF" />
  </a>
</p>

<p align="center">
  <a aria-label="Follow @expo on X" href="https://x.com/intent/follow?screen_name=expo" target="_blank">
    <img alt="Expo on X" src="https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white" target="_blank" />
  </a>&nbsp;
  <a aria-label="Follow @expo on GitHub" href="https://github.com/expo" target="_blank">
    <img alt="Expo on GitHub" src="https://img.shields.io/badge/GitHub-222222?style=for-the-badge&logo=github&logoColor=white" target="_blank" />
  </a>&nbsp;
  <a aria-label="Follow @expo on Reddit" href="https://www.reddit.com/r/expo/" target="_blank">
    <img alt="Expo on Reddit" src="https://img.shields.io/badge/Reddit-FF4500?style=for-the-badge&logo=reddit&logoColor=white" target="_blank" />
  </a>&nbsp;
  <a aria-label="Follow @expo on Bluesky" href="https://bsky.app/profile/expo.dev" target="_blank">
    <img alt="Expo on Bluesky" src="https://img.shields.io/badge/Bluesky-1DA1F2?style=for-the-badge&logo=bluesky&logoColor=white" target="_blank" />
  </a>&nbsp;
  <a aria-label="Follow @expo on LinkedIn" href="https://www.linkedin.com/company/expo-dev" target="_blank">
    <img alt="Expo on LinkedIn" src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=LinkedIn&logoColor=white" target="_blank" />
  </a>

  <p align="center">⭐️ Be sure to star the Expo GitHub repo if you enjoy using the project! ⭐️</p>
</p>

---

The `@expo/codemod` package is a CLI binary provided to help you upgrade between Expo SDK versions.

```
npx @expo/codemod <transform> <paths...>
```

## Usage

Run a transform against one or more paths or globs:

```sh
npx @expo/codemod <transform> <paths...>
```

```
Options:
  <transform>                   (required) name of transform to apply to files
                                (see a list of transforms available below)
  <paths...>                    one or more paths or globs (e.g. src/**/*.tsx) of sources to transform
  -h, --help                    print this help message
  -v, --version                 print the CLI version
```

For example, to run a transform over everything under `src`:

```sh
npx @expo/codemod sdk-56-expo-router-react-navigation-replace src
```

Globs work too (wrap them in quotes so the shell doesn't expand them):

```sh
npx @expo/codemod sdk-56-expo-router-react-navigation-replace '**/*.{ts,tsx,js,jsx}'
```

## Transforms

### `sdk-56-expo-router-react-navigation-replace`

_Used to migrate a React Navigation app to Expo Router (SDK 56)._

Replaces imports from `@react-navigation/*` with their `expo-router` equivalents.

| From                                | To                         |
| ----------------------------------- | -------------------------- |
| `@react-navigation/native`          | `expo-router`              |
| `@react-navigation/stack`           | `expo-router/js-stack`     |
| `@react-navigation/bottom-tabs`     | `expo-router/js-tabs`      |
| `@react-navigation/material-top-tabs` | `expo-router/js-top-tabs` |

Default and namespace imports (`import X from ...` / `import * as X from ...`) from the mapped packages are not supported.

#### Example

Input:

```ts
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
```

Output:

```ts
import { NavigationContainer, useNavigation, useRouter } from "expo-router";
```

# Contributing

## Adding a new transform

1. Drop a new file under `src/transforms/` named `sdk-<n>-<description>.ts` exporting a default jscodeshift `Transform` function. After the next build the runtime glob in [`src/transforms/index.ts`](./src/transforms/index.ts) picks it up automatically — no other wiring needed.
2. Add a sibling test under `src/transforms/__tests__/<name>-test.ts` using `applyTransform` from `jscodeshift/dist/testUtils`.
3. Document the transform under [`## Transforms`](#transforms) above with a from/to table and a short example.
