# Contributing to `@expo/ui`

`@expo/ui` maps native UI frameworks (SwiftUI on iOS, Jetpack Compose on Android) to React Native.

## Before opening a PR

- [ ] Rebuilt JS output: `yarn build` (from `packages/expo-ui/`) and committed the `build/` output.

### When adding or updating a component

- [ ] Added an example to the relevant screen in `apps/native-component-list/src/screens/UI/`
- [ ] Regenerated docs (from repo root): `et gdad -p "expo-ui/swift-ui/<component>"` and/or `et gdad -p "expo-ui/jetpack-compose/<component>"`
- [ ] Added an example in the relevant docs page

### When adding or updating a modifier

- [ ] Added an example to the relevant screen in `apps/native-component-list/src/screens/UI/`
- [ ] Regenerated docs (from repo root): `et gdad -p "expo-ui/swift-ui/modifiers"` and/or `et gdad -p "expo-ui/jetpack-compose/modifiers"`

## Project structure

- `packages/expo-ui/ios/` - Swift/SwiftUI source files
- `packages/expo-ui/android/` - Kotlin/Jetpack Compose source files
- `packages/expo-ui/src/swift-ui/` - TypeScript components and types for the SwiftUI side
- `packages/expo-ui/src/jetpack-compose/` - TypeScript components and types for the Compose side

## General guidelines

- **Match the native APIs** — prop names, types, and behavior should mirror their SwiftUI / Jetpack Compose counterparts as closely as possible.
- **Follow existing patterns** — look at a similar component in the codebase and match its naming, file structure, and prop conventions.
- **Reuse existing types** — before creating a new Record or TypeScript type, check if one already exists.
