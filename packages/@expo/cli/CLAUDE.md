# Expo CLI

CLI tool for all Expo projects. The public interface should be lean, all commands and arguments are very intentional and well thought out. The package is rolled up with swc and a custom taskr file.

## Structure

```
├── bin/cli.ts         # CLI entry point - registers all commands
├── src/
│   ├── api/           # expo.dev API client
│   ├── config/        # `expo config` command
│   ├── customize/     # `expo customize` command
│   ├── export/        # `expo export` command (production bundling)
│   │   ├── web/       # `expo export:web` (deprecated)
│   │   └── embed/     # `expo export:embed` (internal, for native builds)
│   ├── graphql/       # GraphQL schema and queries
│   ├── install/       # `expo install` / `expo add` command
│   ├── lint/          # `expo lint` command
│   ├── login/         # `expo login` command
│   ├── logout/        # `expo logout` command
│   ├── prebuild/      # `expo prebuild` command (native project generation)
│   ├── register/      # `expo register` command
│   ├── run/           # `expo run:ios` / `expo run:android` - native builds
│   │   ├── ios/
│   │   │   ├── appleDevice/    # Physical device communication (lockdown protocol)
│   │   │   ├── codeSigning/    # Certificate and provisioning profile management
│   │   │   ├── options/        # CLI option resolution
│   │   │   ├── XcodeBuild.ts   # Xcode build invocation
│   │   │   └── launchApp.ts    # Simulator/device app launching
│   │   ├── android/
│   │   │   ├── resolveDevice.ts        # ADB device selection
│   │   │   ├── resolveGradlePropsAsync.ts  # Gradle configuration
│   │   │   └── runAndroidAsync.ts      # Gradle build and install
│   │   └── startBundler.ts     # Starts Metro for run commands
│   ├── serve/         # `expo serve` command
│   ├── start/         # `expo start` - development server
│   │   ├── server/
│   │   │   ├── metro/          # Metro bundler integration
│   │   │   │   ├── MetroBundlerDevServer.ts    # Main Metro dev server class
│   │   │   │   ├── instantiateMetro.ts         # Metro instance creation
│   │   │   │   ├── withMetroMultiPlatform.ts   # Multi-platform bundle resolution
│   │   │   │   ├── withMetroResolvers.ts       # Custom resolver chain
│   │   │   │   ├── dev-server/     # Metro dev server utilities
│   │   │   │   ├── debugging/      # Chrome DevTools protocol
│   │   │   │   └── log-box/        # LogBox integration
│   │   │   ├── middleware/     # HTTP middleware stack
│   │   │   │   ├── ManifestMiddleware.ts       # Expo manifest serving
│   │   │   │   ├── ExpoGoManifestHandlerMiddleware.ts  # Expo Go support
│   │   │   │   ├── DomComponentsMiddleware.ts  # DOM components (use dom)
│   │   │   │   └── DevToolsPluginMiddleware.ts # Dev tools plugin support
│   │   │   ├── type-generation/    # TypeScript type generation
│   │   │   ├── webpack/        # Webpack bundler (legacy)
│   │   │   ├── DevServerManager.ts     # Coordinates multiple dev servers
│   │   │   ├── BundlerDevServer.ts     # Base class for bundler servers
│   │   │   └── UrlCreator.ts           # Dev server URL generation
│   │   ├── platforms/          # Platform-specific launchers
│   │   │   ├── ios/            # iOS simulator launching
│   │   │   └── android/        # Android emulator launching
│   │   ├── doctor/             # Startup diagnostics
│   │   │   ├── apple/          # Xcode/iOS toolchain checks
│   │   │   ├── dependencies/   # Dependency validation
│   │   │   ├── typescript/     # TypeScript config checks
│   │   │   └── web/            # Web platform checks
│   │   └── interface/          # Terminal UI (interactive prompts)
│   ├── utils/         # Shared utilities
│   └── whoami/        # `expo whoami` command
├── e2e/
│   ├── __tests__/     # E2E CLI tests (`yarn test:e2e`)
│   ├── playwright/    # E2E Metro web/server tests (`yarn test:playwright`)
│   ├── fixtures/      # Test fixtures
│   └── utils/         # Test utilities
├── static/
│   ├── loading-page/  # Default loading page HTML for dev server
│   ├── shims/         # Web polyfills for Metro (react-native-web shims)
│   └── template/      # Template files for `expo customize`
├── metro-require/     # Custom Metro require with named module support
├── internal/          # Internal exports (used by expo-updates)
├── ts-declarations/   # TypeScript declaration files
└── docs/              # Additional documentation for agents
```

## Reference

Read additional resource files:

- ./docs/testing.md - Anything related to testing

## Windows

- Normalize paths for windows with `convertPathToModuleSpecifier`

## Debug logs

Debug logs support `DEBUG=expo:*`, for legacy reasons we support `EXPO_DEBUG=1` which sets `DEBUG=expo:*` in the bin.ts file.

## Production

Expo CLI is distributed via npm. Files are intentionally included via the `files` array in the `package.json`, with ignores in the `.npmignore` file.

Production build is performed with `yarn prepublishOnly` -> `yarn prepare` -> `taskr release` which evaluates the `taskfile.js` to bundle code into the root build directory.
