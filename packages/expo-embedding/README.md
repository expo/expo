# expo-embedding

This private prototype starts with the dependency and native metadata layer for embedding Expo in an existing native app. The CLI and platform integration are added in the next layers of the PR stack.

Expo autolinking discovers installed modules. Build metadata comes from an installed Package.swift, spm.config.json, or a restricted podspec parser, in that order. Unsupported build declarations stop setup rather than silently dropping settings. The podspec parser does not execute Ruby or use CocoaPods. Package.swift is evaluated by Swift and can execute package code.

The layer also provides package-manager selection, migration of legacy dependency links, and rollback for generated files. Runtime validation currently accepts Expo SDK 58, React Native 0.88.0, and React 19.3.0.

## Development

Run npm install, npm test, and npm run build in this directory. The build emits the native metadata helper; this layer does not expose a CLI yet.

## Test plan

Tests cover supported metadata, unsupported declarations, source containment, target dependencies, version checks, frozen installs, dependency-link migration, and rollback after generation fails. Native build validation belongs to the platform integration layers.
