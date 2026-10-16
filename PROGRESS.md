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

- **iOS runtime check (not run).** Run `apps/router-tester` on an EAS iOS simulator, as described in `apps/router-tester/AGENTS.md`:
  - Deep link to a screen that uses the prop. The back button must show on the first paint. Back must go through the inserted screens.
  - Push to that screen from outside the stack. The push animation must be a single normal push, with no flicker.
  - Take before and after screenshots for the pull request.
  - An iOS simulator development build from base `9ccb2ecc266` exists: `c39d06fa-e8be-4125-850b-1e60584f60d6`.
- **Android and web runtime checks.** Not run. Name them in the Test Plan, or run them.
- **Open risks**, accepted in the plan:
  - Until the sync, an inserted screen gets a new navigation object on each render.
  - An action that an inserted screen sends before the sync, for example `setParams` in a mount effect, can be lost.
  - On web, Back from the screen skips the inserted screens.
  - There is no test for another action that lands before the sync. Only the reducer logic covers that case.
- **Optional review nits not applied:**
  - A dev warning when the prop is used on a `Stack.Screen` inside a page.
  - Moving the internal option type into `InternalNavigationOptions`. That move brings back an import cycle.
  - A test that writes a module variable during render.
- **Pull request:** open it as a draft until the runtime check is done.
