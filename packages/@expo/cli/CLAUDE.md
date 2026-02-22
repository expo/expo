# Expo CLI

CLI tool for all Expo projects. The public interface should be lean, all commands and arguments are very intentional and well thought out. The package is rolled up with swc and a custom taskr file.

## Structure

```
├── bin/cli.ts         # CLI entry point - registers all commands
├── src/
│   ├── api/           # expo.dev API client
│   ├── events/        # JSONL event-based debugger
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

Windows support requires careful path handling throughout the codebase.

### Path Separators

Metro assumes all module specifiers use POSIX paths (forward slashes `/`). On Windows, `path.sep` is `\` (backslash), which breaks Metro resolution.

**Key utilities:**
- `convertPathToModuleSpecifier(path)` - from `src/start/server/middleware/metroOptions.ts` - converts paths to POSIX format for Metro module resolution
- `toPosixPath(path)` - from `src/utils/filePath.ts` - general-purpose path conversion

**When to use:**
- Any path passed to Metro as a module specifier
- Entry points, main module names, relative imports
- Source map source paths

**Common mistakes to avoid:**
```ts
// BAD: Uses platform-specific separator
'.' + path.sep + moduleName

// GOOD: Use literal forward slash
'./' + moduleName

// BAD: Passing Windows path to Metro
metro._resolveRelativePath(moduleId)

// GOOD: Convert first
metro._resolveRelativePath(convertPathToModuleSpecifier(moduleId))
```

### Environment Variables

Windows environment variables are case-insensitive at the OS level, but Node.js `process.env` preserves case. Handle both forms when needed:
```ts
process.env.SYSTEMROOT ?? process.env.SystemRoot
```

See `src/utils/open.ts` for an example of handling the `SYSTEMROOT`/`SystemRoot` case sensitivity issue.

### Platform Limitations

- iOS development (`expo run:ios`, `expo prebuild` for iOS) is not supported on Windows
- `resolveOptions.ts` filters out iOS platform when running on Windows

### Testing Windows Support

- Use `path.sep` parameter in tests to simulate Windows paths (see `src/start/server/type-generation/__tests__/routes.test.ts`)
- The typed routes system (`getTypedRoutesUtils`) accepts a custom `filePathSeparator` for testing

## Debug logs

**Old debugging system:**
Debug logs used to be created with the `debug` package with individual modules creating a `debug` function to use for logging.
This can then be activated with `DEBUG=expo:*`, and for legacy reasons `EXPO_DEBUG=1` currently sets `DEBUG=expo:*` in the bin.ts file.

```ts
const debug = require('debug')('expo:utils:example');
debug('hello');
```

**New debugging system:**
Newer modules use the `events` helper from `src/events/index.ts` to define structured events in JSON format.

```ts
export const event = events('metro', (t) => [
  t.event<'example:start', {
    value: string;
  }>(),
]);

event('metro:example:start', { value: 'hello' });
```

The `events` function accepts a category name and a function that is used to define the event types, but never called.
When setting `LOG_EVENTS=1` JSONL events will be logged to the standard output, or with `LOG_EVENTS=events.log` events will log to an events.log file.
This is a faster events system than `debug`, captures structured JSON events, and is scalable, and can be used in any module to add richer debug output.

When creatin a nwe events category, add the `event` function it returns to the `Events` type in `src/events/types.ts` to collect all the events' types in one place:

```
// Add a new import:
import type { event as myNewEvent } from '...';

export type Events = collectEventLoggers<[
  typeof myNewEvent, // Add the imported new event function here
]>;
```

## Production

Expo CLI is distributed via npm. Files are intentionally included via the `files` array in the `package.json`, with ignores in the `.npmignore` file.

Production build is performed with `yarn prepublishOnly` -> `yarn prepare` -> `taskr release` which evaluates the `taskfile.js` to bundle code into the root build directory.
