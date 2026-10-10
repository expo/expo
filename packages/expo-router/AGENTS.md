# Expo Router

Expo Router turns app files into routes for React Native and web. Judge features by what Expo Router exposes; `expo-router/react-navigation` is a compatibility layer, not a promise that every React Navigation feature is available through Router.

## Where to look

- `src/` contains routing, navigation, views, hooks, server integration, and tests.
- `ios/` contains Swift modules, native views, and tests; `android/` contains the Kotlin module and Android build configuration.
- `plugin/` contains the Expo config plugin and its tests.
- [`@expo/router-server`](../@expo/router-server/package.json) uses Router internals for route manifests, typed routes, and server rendering
- [`@expo/cli`](../@expo/cli/package.json) depends on it for development and export.

## Conventions

- Put native implementation and tests in `ios/` or `android/` as appropriate; put config plugin changes in `plugin/`. Keep shared JavaScript and TypeScript behavior in `src/`.
- Use `.ios`, `.android`, `.native`, and `.web` file suffixes for platform-specific implementations and tests. Import implementation modules through their extensionless base path so the resolver selects the matching variant.

## Build and checks

Run focused package scripts from `packages/expo-router` as needed:

- `pnpm test <test-file>` for relevant Jest tests; `pnpm test` for the full package suite.
- `pnpm typecheck` for TypeScript checks, `pnpm lint` for lint, and `pnpm build` for package builds. If files were moved or removed, consider `pnpm clean` before building.

## Testing

- Name tests for the behavior they check and keep them as minimal as possible. Write the specific tests strictly needed to prove a change.
- Prefer `renderRouter` from [`src/testing-library`](src/testing-library/index.tsx) for route behavior
- The `renderHook` re-exported by `src/testing-library` is the plain React Native Testing Library helper. For hooks that need Router context, use the route-aware [`src/hooks/__tests__/renderHook.tsx`](src/hooks/__tests__/renderHook.tsx) helper.
- Restore spies and mocks after tests. Explain non-obvious mock call indices close to their assertions.
- For Swift changes, tests in `ios/Tests/` use Swift Testing (`@Test`/`@Suite`, `#expect`/`#require`). Run `et native-unit-tests --packages expo-router -p ios` when relevant. See [native test tooling](../../tools/src/commands/IosNativeUnitTests.ts).

## Code style

- Keep functions short. Add inline comments when they explain non-obvious behavior. Every `as` cast needs a nearby comment explaining why the cast is sound or necessary.
- Avoid `useRef` unless necessary. For latest-value callbacks in effects, consider React's `useEffectEvent`; for stable callback identity, consider [`useLatestCallback`](src/utils/useLatestCallback.ts). Check each call site's constraints; retain a ref when mutable identity is required.
- Prefer `if` over ternaries. Use a ternary only when it is more readable and both the condition and results are simple. Extract a complex condition to a `const`.
- Do not assign a `let` inside `if` branches. Extract the logic to a function and assign its result to a `const`.
- Keep code working with and without React Compiler. Prefer `unknown` and narrow it where practical instead of adding `any`.

## App verification

Use the [router-tester app](../../apps/router-tester/README.md) for app behavior that needs a simulator. Internal agent runs follow its [EAS simulator instructions](../../apps/router-tester/AGENTS.md); external contributors use the README's local iOS or Android simulator setup. The README also documents its Maestro test.

For integration or end-to-end projects, inspect [`apps/router-e2e`](../../apps/router-e2e/package.json) and the relevant [`@expo/cli` test scripts](../@expo/cli/package.json). Select a project and platform that exercise the changed behavior; do not require a simulator for every edit.

## Changelog and docs

For a relevant [changeset](../../.changeset/README.md) (do not edit `CHANGELOG.md` directly), write one short sentence about the user-visible change and include necessary breaking-change or migration information. Omit background, edge-case lists, unchanged behavior, and speculative effects; put implementation detail in the PR description or docs.

Update affected guides or API reference in [`docs/`](../../docs/) when behavior or public API changes.
