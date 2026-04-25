# expo-ui component guidelines

expo-ui is a library of native UI components for React Native, bridging SwiftUI views on iOS and Jetpack Compose components on Android. Each platform has its own set of components exported from `@expo/ui/swift-ui` and `@expo/ui/jetpack-compose` respectively.

## Core principle

Bridge native components to JavaScript with as little abstraction as possible. Native views should be thin wrappers — no added logic, state management, or behavior beyond what the platform component provides. Everything that can be set or controlled from JavaScript should be controlled from JavaScript.

Prefer controlled components: state lives in JS and is passed as props, not managed internally by the native view. Use a prop + callback pattern (e.g. `page` + `onPageChange`) instead of imperative ref methods (e.g. `setPage(index)`). This keeps the source of truth in React and makes components predictable and composable.

## Naming

- The JavaScript API must mirror the native APIs closely.
- Exported components must have the same name as the underlying native component (e.g. SwiftUI `TabView` -> export `TabView`, Jetpack Compose `HorizontalPager` -> export `HorizontalPager`).
- Don't turn native-layer modifiers into props in the JS layer — modifiers stay as modifiers.
- Use `export function ComponentName` (the dominant pattern in this codebase). Use `export const` only for non-component values like modifiers or constants. Avoid the `export { LocalName as ExportName }` rename pattern unless the local name must differ.
- Props, constants, and enum values must use the same names as the native API. If SwiftUI calls it `scrollEnabled`, the JS prop is `scrollEnabled`. If Compose calls it `userScrollEnabled`, the JS prop is `userScrollEnabled`.
- Ensure components have the correct display name in React DevTools. Either name the function directly (e.g. `function TabView`) or set `.displayName`.

## Props and events

- Include JSDoc for every supported prop.
- Events follow the expo-ui `ViewEvent` pattern: the public JS callback receives unwrapped values (e.g. `onPageSelected?: (position: number) => void`), and the component internally adapts to/from the native event shape.

## Native code

- Expose all configurable properties of the underlying native component as props. Don't hardcode values that the user might want to change.
- Use `@Field` (iOS) and data class fields (Android) for props, `EventDispatcher` for events, and `AsyncFunction` for imperative methods when unavoidable.

## File structure

- iOS (SwiftUI): `packages/expo-ui/ios/<ComponentName>/<ComponentName>View.swift` (or `ios/<ComponentName>View.swift` for simple components)
- Android (Compose): `packages/expo-ui/android/src/main/java/expo/modules/ui/<ComponentName>View.kt`
- TypeScript (SwiftUI): `packages/expo-ui/src/swift-ui/<ComponentName>/index.tsx`
- TypeScript (Compose): `packages/expo-ui/src/jetpack-compose/<ComponentName>/index.tsx`
- Register views in `ios/ExpoUIModule.swift` and `android/.../ExpoUIModule.kt`
- Export from `src/swift-ui/index.tsx` and `src/jetpack-compose/index.ts`

## Example screens

For every component added, create example screens in NCL (native-component-list):

- `apps/native-component-list/src/screens/UI/<ComponentName>Screen.ios.tsx` — imports from `@expo/ui/swift-ui`
- `apps/native-component-list/src/screens/UI/<ComponentName>Screen.android.tsx` — imports from `@expo/ui/jetpack-compose`
- Register in both `UIScreen.ios.tsx` and `UIScreen.android.tsx`
- Keep the minimum set of examples needed to cover available features.

## Before committing

1. Run `pnpm build` in the package directory — the `build/` output must be committed alongside source changes. CI will fail otherwise.
2. Run `pnpm lint --max-warnings 0`.
3. Add a changelog entry to `CHANGELOG.md` under the "Unpublished" section.
4. When adding a new component, add documentation for it. When adding a new feature to an existing component, update its documentation accordingly. Docs are MDX files in `docs/pages/versions/unversioned/sdk/ui/swift-ui/` and `docs/pages/versions/unversioned/sdk/ui/jetpack-compose/`.
5. Regenerate API docs data by running `et gdad -p @expo/ui`. If the change is to be cherry-picked to an already-released SDK version, also run `et gdad -p @expo/ui -s <version>` (e.g. `et gdad -p @expo/ui -s 55` for SDK 55). Changes are very likely to be picked to the latest stable of expo-ui (`npm view @expo/ui version`).
