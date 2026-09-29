# Expo Router

Expo Router turns app files into routes for React Native and web. Judge features by what Expo Router exposes; `expo-router/react-navigation` is a compatibility layer, not a promise that every React Navigation feature is available through Router.

## Where to look

- Start with `src/index.tsx`, `src/exports.ts`, `src/ExpoRoot.tsx`, and `src/getRoutes.ts`; inspect current source for details instead of relying on a static directory map.
- Routes follow file names: `page/index.tsx` maps to `/page`, `post/[id].tsx` has a dynamic segment, and `(group)/_layout.tsx` defines a URL-invisible layout group.
- Read [stack header and toolbar instructions](src/layouts/stack-utils/AGENTS.md) before changing that directory.
- Native implementations live in `ios/` and `android/`; the config plugin lives in `plugin/`.
- [`@expo/router-server`](../@expo/router-server/package.json) uses Router internals for route manifests, typed routes, and server rendering; [`@expo/cli`](../@expo/cli/package.json) depends on it for development and export. Check both packages when changing those flows.
- `expo-router/server` re-exports APIs from the separate [`expo-server`](../expo-server/package.json) dependency.

## Build and checks

Run focused package scripts from `packages/expo-router` as the change warrants:

- `pnpm test <test-file>` for relevant Jest tests; `pnpm test` for the full package suite.
- `pnpm typecheck` for TypeScript checks, `pnpm lint` for lint, and `pnpm build` for package builds. If files were moved or removed, consider `pnpm clean` before building.

At the repository root, `pnpm build`, `pnpm typecheck`, `pnpm lint`, and `pnpm test` use `bin/expo-turbo` to invoke Turbo for workspace tasks. `build` includes dependency builds; `test` and `lint` are uncached. Use root tasks when dependency or workspace coverage matters. For substantial package changes, `et check-packages expo-router` runs broader package checks; see [repository tooling guidance](../../.claude/CLAUDE.md). Choose checks based on the changed behavior and report what ran.

## Testing

- Name tests for the behavior they check. Write the specific tests needed to prove a change; cover affected platforms and React Server Components when those behaviors are involved. Package [Jest projects](jest.config.js) include iOS, Android, web, Node, plugin, and RSC tests.
- Prefer `renderRouter` from [`src/testing-library`](src/testing-library/index.tsx) for route behavior. Its return value has `getPathname()`, `getSegments()`, and `getSearchParams()`; these are not `screen` methods.
- The `renderHook` re-exported by `src/testing-library` is the plain React Native Testing Library helper. For hooks that need Router context, use the route-aware [`src/hooks/__tests__/renderHook.tsx`](src/hooks/__tests__/renderHook.tsx) helper.
- Restore spies and mocks after tests. Explain non-obvious mock call indices close to their assertions.
- For Swift changes, tests in `ios/Tests/` use Swift Testing (`@Test`/`@Suite`, `#expect`/`#require`). Run `et native-unit-tests --packages expo-router -p ios` when relevant. It uses `apps/bare-expo/ios/BareExpo.xcworkspace`; install pods in `apps/bare-expo/ios` first, and again after an iOS `test_spec` change. See [native test tooling](../../tools/src/commands/IosNativeUnitTests.ts).

## Code style

- Keep functions short. Add inline comments when they explain non-obvious behavior. Every `as` cast needs a nearby comment explaining why the cast is sound or necessary.
- Avoid `useRef` unless necessary. For latest-value callbacks in effects, consider React's `useEffectEvent`; for stable callback identity, consider [`useLatestCallback`](src/utils/useLatestCallback.ts). Check each call site's constraints; retain a ref when mutable identity is required.
- Keep code working with and without React Compiler. Prefer `unknown` and narrow it where practical instead of adding `any`.
- Import platform variants through their extensionless base path so the resolver selects `.ios`, `.android`, `.native`, or `.web` implementations.

## App verification

Use the [router-tester app](../../apps/router-tester/README.md) for app behavior that needs a simulator. Internal agent runs follow its [EAS simulator instructions](../../apps/router-tester/AGENTS.md); external contributors use the README's local iOS or Android simulator setup. The README also documents its Maestro test.

For integration or end-to-end projects, inspect [`apps/router-e2e`](../../apps/router-e2e/package.json) and the relevant [`@expo/cli` test scripts](../@expo/cli/package.json). Select a project and platform that exercise the changed behavior; do not require a simulator for every edit.

## Changelog and docs

For a relevant [`CHANGELOG.md`](CHANGELOG.md) entry, write one short sentence about the user-visible change and include necessary breaking-change or migration information. Omit background, edge-case lists, unchanged behavior, and speculative effects; put implementation detail in the PR description or docs.

Update affected guides or API reference in [`docs/`](../../docs/) when behavior or public API changes. Update this guide when enduring package guidance changes.
