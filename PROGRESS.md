# ENG-28229 progress: `unstable_requiredScreensBelow`

Ticket: https://linear.app/expo/issue/ENG-28229/router-research-required-screens-below-a-stack-screen

Base: `main` at `9ccb2ecc266`.

Delete this file before the pull request leaves draft.

## Done

- A `Stack.Screen` in a layout accepts `unstable_requiredScreensBelow`. Each item is a route name or `{ name, params }`.
- When the screen is focused, the Stack inserts the missing screens directly below it in the same render. It uses the `processState` and `processDescriptors` integration options, the same hooks that Tabs use for placeholder routes.
- `describe(route, { create: true })` in `useDescriptors.tsx` builds a descriptor for a route that is not in the state. A nested layout gets a seeded state, so its keys match the global state after the sync.
- A layout effect queues the `SYNC_REQUIRED_SCREENS` stack action. The reducer runs the same insertion again. It runs only while the route is still focused, and it adds only the missing screens.
- On web, the sync replaces the current history entry. It does not push a new one.
- Tests: 6 tests in `stacks.test.ios.tsx` and 2 tests in `useNavigationTreeReducer.test.web.tsx`. Each test failed before the change.
- Docs: a new section on the unversioned Stack page and the regenerated `stack.json`. A changeset was added.
- Three local reviews with `ubax-review`. Each review approved with optional nits. The last review found no blocking problem.
- Checks that pass:
  - The full `expo-router` Jest suite: 459 suites, 5995 tests.
  - `pnpm typecheck`, `pnpm lint`, and `oxfmt`.
  - `et check-packages expo-router`.
  - Docs: Vale and docs lint.

### Differences from the plan in the ticket

- The plan named `src/react-navigation/native-stack/navigators/createNativeStackNavigator.tsx`. The Expo Router `Stack` does not use that file. The change is in `fork/native-stack/createNativeStackNavigator.tsx` and in the `StackClient.tsx` integration options.
- The prop reaches the navigator as the internal option `internal_requiredScreensBelow`, the same pattern as `internal_gestureEnabled`. `getRouteConfigsFromChildren` is not exported.
- The sync action carries `{ routeKey, screens }`, not the rendered routes.
- A matching preloaded route is not reused. A new route is created.
- There is no test for "`describe` without `create` throws", because that test passes on the old code.
- Unknown route names are skipped. No warning is shown.

## Still to do

- **Demo screens (not committed).** The runtime checks used a local `apps/router-tester/app/required-below/` group: `index`, `[id]`, and `[id]/comments` with the docs example prop. A home link points to `/required-below/42/comments`. Decide if the pull request keeps them.
- **Cold-start deep link on native (not run).** The development client does not accept an initial path. Unit tests cover the initial state.
- **Pull request:** open it as a draft. Add the screenshots and the runtime results below to the Test Plan.

- **Open risks**, accepted in the plan:
  - Until the sync, an inserted screen gets a new navigation object on each render.
  - An action that an inserted screen sends before the sync, for example `setParams` in a mount effect, can be lost.
  - On web, Back from the screen skips the inserted screens.
  - There is no test for another action that lands before the sync. Only the reducer logic covers that case.
- **Optional review nits not applied:**
  - A dev warning when the prop is used on a `Stack.Screen` inside a page.
  - Moving the internal option type into `InternalNavigationOptions`. That move brings back an import cycle.
  - A test that writes a module variable during render.

## Runtime checks (2026-10-16)

The before run used the same demo without the prop.

- **iOS**, EAS simulator, dev build `c39d06fa`:
  - Push from the root home: one normal push. The `[id]` back button shows from the first frame. Back goes to `[id]` (42), then to `index` (`tab: all`).
  - Deep link `router-tester://required-below/7/comments` while the app runs: the same result.
  - Before: no back button on `[id]/comments`.
- **Android**, EAS emulator, dev build `ffc3f1b3`:
  - Push and deep link: back goes to `[id]`, then to `index`.
  - Before and after look the same: the header shows "Navigate up" because the root stack can go back. Only the back target changes.
- **Web**, local Metro and Chrome:
  - Deep link: the header back button shows. Header back goes to `/required-below/42`, then to `/required-below?tab=all`. The sync adds no history entry.
  - Push from home, then browser back: goes to `/`. This matches the documented web limit.
  - Before: no header back button after the deep link.
  - No console errors.
