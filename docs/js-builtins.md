# Expo JS Built-ins System

This document describes the Expo built-in modules system in Expo Go, which pre-bundles common modules directly into the native binary to reduce bundle sizes and improve startup performance.

## Overview

The JS built-ins system allows Expo Go to ship commonly-used JavaScript modules (React, React Native, Expo packages, etc.) as pre-compiled bytecode embedded in the native app binary. When the `EXPO_USE_STD_RUNTIME` environment variable is enabled, Metro resolves imports for these modules to a lightweight shim that delegates to the pre-loaded built-ins rather than bundling the full module source.

### Key Benefits

- **Smaller JS bundles**: User code no longer needs to include React, React Native, or other common dependencies
- **Faster startup**: Built-in modules are pre-compiled to Hermes bytecode (`.hbc`)
- **Faster bundle times**: Metro skips transforming and bundling built-in modules, significantly reducing dev server bundle time
- **Increased backwards compatibility**: Apps can use newer package versions than what's bundled in Expo Go since the built-in versions take precedence
- **Shared instances**: All apps use the same React/React Native instance, avoiding version mismatches

> **Note**: This is an **optional, development-only optimization**. It only applies when running in Expo Go with `EXPO_USE_STD_RUNTIME` enabled. Production builds (via `expo export` or `expo run`) always bundle all dependencies normally.

## Comparison to Bun/Node.js

This system makes Expo Go work more like Bun or Node.js by providing built-in modules that don't need to be bundled:

**Similarities to Bun/Node.js:**
1. **Browser built-ins**: Globals like `fetch`, `URL`, `TextEncoder` are available without polyfilling them in the user bundle
2. **Standard library**: Common packages required for Expo apps are pre-installed and available at runtime

**Key Differences from Node.js:**
- Node.js uses the `node:` prefix for built-ins (e.g., `node:path`, `node:fs`)
- Expo uses the `expo:` prefix, but primarily exposes **React Native ecosystem packages** rather than Node.js APIs
- The focus is on modules required to start React Native: `react`, `react-native`, `url`, `react-is`, `scheduler`, etc.

```javascript
// Node.js built-ins:
import path from 'node:path';
import fs from 'node:fs';

// Expo built-ins (implicit when EXPO_USE_STD_RUNTIME=1):
import React from 'react';        // Resolves to expo:react
import { View } from 'react-native';  // Resolves to expo:react-native
```

## Important Considerations

### Versioning is Tied to Native App

When the standard runtime is enabled, **module versions are determined by the Expo Go binary**, not your project's `package.json`. This means:

- Local copies in `node_modules` are **ignored** for built-in modules
- You cannot override React/React Native versions when using this feature
- The versions match what's bundled in that specific Expo Go release

```javascript
// With EXPO_USE_STD_RUNTIME=1:
import React from 'react';
// -> Uses Expo Go's bundled React, NOT node_modules/react

// Your package.json version is irrelevant for built-ins
```

### Nested Imports Require Explicit Names

Built-in modules only support **explicitly defined import paths**. File extensions and alternative paths are not supported:

```javascript
// ✅ Works - explicitly exposed
import { jsx } from 'react/jsx-runtime';
import { jsx } from 'react/jsx-dev-runtime';

// ❌ Does NOT work - not explicitly exposed
import { jsx } from 'react/jsx-runtime.js';  // .js extension fails
import something from 'react/cjs/react.production.min.js';  // Deep path fails

// ❌ DANGER: May pull in wrong copy and corrupt global state
// If a path isn't in the builtins list, Metro resolves it from node_modules,
// potentially creating duplicate React instances
```

Each nested import must be explicitly added to both:
1. `apps/builtins/index.ts` - The `EXPOSE()` call
2. `withMetroMultiPlatform.ts` - The `builtins` array

### Source Maps and Stack Traces

The built-ins bundle is compiled **without source maps** to reduce binary size. As a result, stack traces originating from built-in code will show `[builtin code]` instead of actual file paths:

```
Error: Something went wrong
    at Component (App.js:15:10)
    at renderWithHooks ([builtin code])
    at mountIndeterminateComponent ([builtin code])
    at beginWork ([builtin code])
    at performUnitOfWork ([builtin code])
```

This is intentional behavior configured in the serializer:

```typescript
// baseJSBundle.ts
sourceUrl: process.env.EXPO_BUNDLE_BUILT_IN === '1'
  ? '[builtin code]'
  : // ... normal source URL
```

**Implications:**
- Errors in React internals, React Native core, or Expo packages will not show file paths
- User code (your app) still has full source map support
- This is similar to how native code appears in stack traces (e.g., `[native code]`)
- For debugging built-in issues, you may need to disable `EXPO_USE_STD_RUNTIME` temporarily to get full stack traces

## Architecture

### 1. Built-ins Bundle Definition (`apps/builtins/index.ts`)

The built-ins are defined using a special `EXPOSE` function that registers modules with the `expo:` prefix:

```typescript
const EXPOSE = (name, getter) => __expo__d((_, __, ___, ____, module) => {
  module.exports = getter()
}, `expo:${name}`);

// Examples:
EXPOSE('react', () => require('react'));
EXPOSE('react-native', () => require('react-native'));
EXPOSE('expo-image', () => require('expo-image'));
```

The `__expo__d` function is the custom Metro define function with the `__expo` prefix, which allows the built-ins bundle to have its own isolated module registry separate from the main app bundle.

### 2. Custom Metro Configuration (`apps/builtins/metro.config.js`)

The built-ins bundle uses a specialized Metro configuration:

```javascript
// Use the special prefix for our nested runtime
config.transformer.globalPrefix = '__expo';

// Disable the default react-native run statements
config.serializer.getModulesRunBeforeMainModule = () => ([]);
```

Key aspects:
- **`globalPrefix: '__expo'`**: Changes the global functions from `__d`/`__r` to `__expo__d`/`__expo__r`, creating an isolated module registry
- **Empty `getModulesRunBeforeMainModule`**: Prevents React Native initialization code from running automatically (the main bundle handles this)

### 3. Native Integration (`ExpoGoRootViewFactory.mm`)

The Expo Go iOS app loads the built-ins bundle before the main app bundle using React Native's `RCTHostRuntimeDelegate`:

```objc
- (void)host:(RCTHost *)host didInitializeRuntime:(facebook::jsi::Runtime &)runtime
{
  [self _loadBuiltinsIntoRuntime:runtime];
}

- (void)_loadBuiltinsIntoRuntime:(facebook::jsi::Runtime &)runtime
{
  NSString *builtinsPath = [[NSBundle mainBundle] pathForResource:@"builtin" ofType:@"hbc"];
  // ... load and evaluate builtin.hbc
  runtime.evaluateJavaScript(buffer, "builtin.hbc");
}
```

The built-ins are:
1. Pre-compiled to Hermes bytecode (`builtin.hbc`)
2. Embedded in the app bundle as a resource
3. Evaluated **before** the main app bundle loads
4. Registered under `__expo__d` / `__expo__r` globals

### 4. Metro Resolver Integration (`withMetroMultiPlatform.ts`)

When `EXPO_USE_STD_RUNTIME` is enabled, Metro's resolver creates virtual modules that delegate to the built-ins:

```typescript
const builtins = [
  'react',
  'react/jsx-dev-runtime',
  'react-native',
  'expo',
  'expo-image',
  // ... many more
];

// When resolving a builtin module:
if (external.replace === 'builtin') {
  const contents = `module.exports=__expo__r('expo:${interopName}')`;
  const virtualModuleId = `\0expo:${interopName}`;
  getMetroBundlerWithVirtualModules(getMetroBundler()).setVirtualModule(
    virtualModuleId,
    contents
  );
  return { type: 'sourceFile', filePath: virtualModuleId };
}
```

For example, when user code imports `react`:
1. Metro matches it against the `builtins` list
2. Instead of resolving to `node_modules/react/index.js`, it returns a virtual module
3. The virtual module exports: `module.exports = __expo__r('expo:react')`
4. At runtime, `__expo__r` looks up the module in the built-ins registry

### 5. Virtual Module System

Expo CLI uses a virtual module system for creating modules that don't exist on disk. Virtual modules:
- Start with a null byte (`\0`) to distinguish from real files
- Are stored in Metro's file system via `getMetroBundlerWithVirtualModules()`
- Support patterns like `\0expo:react`, `\0polyfill:assets-registry`, `\0node:fs`

```typescript
// metroVirtualModules.ts
function ensureMetroBundlerPatchedWithSetVirtualModule(bundler) {
  bundler.setVirtualModule = function(id, contents) {
    fs.expoVirtualModules.set(ensureStartsWithNullByte(id), Buffer.from(contents));
  };
}
```

### 6. Custom Metro Require Runtime

Two require runtimes exist:

**Standard Runtime (`metro-require/require.ts`)**:
- Used for regular app bundles
- Registers as `__r` and `__d`
- Includes HMR support, React Refresh integration

**Native Built-in Runtime (`metro-require/native-require.ts`)**:
- Used when `EXPO_BUNDLE_BUILT_IN=1` is set
- Registers as `__expo__r` and `__expo__d`
- Simplified version without HMR (built-ins are static)
- Includes `Symbol.for('expo.embeddedRequire')` marker for identification

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_USE_STD_RUNTIME` | Enables built-in module resolution. When set, imports of listed modules resolve to virtual shims that delegate to `__expo__r` |
| `EXPO_BUNDLE_BUILT_IN` | Set when building the built-ins bundle itself. Changes Metro's global prefix to `__expo` and disables source maps |

## Building the Built-ins

```bash
cd apps/builtins
# Build for iOS
npx expo export:embed --platform ios
# Output: dist/builtin.hbc
```

The `.env` file configures the build:
```
EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH=0
EXPO_UNSTABLE_TREE_SHAKING=0
EXPO_USE_METRO_REQUIRE=1
EXPO_BUNDLE_BUILT_IN=1
EXPO_NO_CLIENT_ENV_VARS=1
```

## Polyfills Handling

When `EXPO_USE_STD_RUNTIME` is enabled, standard polyfills are skipped since they're already included in the built-ins:

```typescript
// withMetroMultiPlatform.ts - getPolyfills()
if (env.EXPO_USE_STD_RUNTIME && ctx.platform !== 'web') {
  // Ignore the polyfills because they're included in the standard runtime
  return [...virtualModulesPolyfills];
}
```

## Supported Built-in Modules

Current list includes:
- **React ecosystem**: `react`, `react/jsx-runtime`, `react-is`, `scheduler`
- **React Native**: `react-native`, various internal RN modules
- **Expo packages**: `expo`, `expo-image`, `expo-font`, `expo-linking`, etc.
- **Navigation**: `@react-navigation/*` packages
- **Utilities**: `color`, `query-string`, `invariant`, `buffer`, etc.

See the full list in `apps/builtins/index.ts` and the `builtins` array in `withMetroMultiPlatform.ts`.

## Module Resolution Flow

```
User code: import React from 'react'
    |
    v
Metro Resolver (EXPO_USE_STD_RUNTIME=1)
    |
    v
Check: Is 'react' in builtins list?
    |
    v (yes)
Create virtual module: \0expo:react
    Contents: module.exports = __expo__r('expo:react')
    |
    v
Bundle includes tiny shim instead of full React source
    |
    v
At runtime: __expo__r('expo:react') -> built-in registry -> React exports
```

---

## TODOs

### 1. Prefix Internal Modules with Underscore

Internal modules that aren't meant to be imported directly with the `expo:` prefix should be prefixed with an underscore to denote their privacy.

**Current state**: All exposed modules use their package name directly (e.g., `expo:react-native/Libraries/Core/InitializeCore`)

**Proposed change**: Internal/implementation modules should use underscore prefix:
```typescript
// Instead of:
EXPOSE('react-native/Libraries/Core/InitializeCore', ...)

// Use:
EXPOSE('_react-native/Libraries/Core/InitializeCore', ...)
// Or:
EXPOSE('_internal/rn-initialize-core', ...)
```

This makes it clear which modules are part of the public API vs internal implementation details.

### 2. Runtime Capability Detection

Expo Go should signal to the dev server that it supports built-ins, preventing the server from serving `EXPO_USE_STD_RUNTIME` bundles to runtimes that can't handle them.

**Options**:

a) **Query Parameter**: Add `?builtins=1` or `?runtime=std` to bundle requests
```
http://localhost:8081/index.bundle?platform=ios&builtins=1
```

b) **Custom Header**: Send `X-Expo-Builtins-Version: 1` or `X-Expo-Runtime: std`

c) **User-Agent**: Include runtime info in User-Agent string
```
Expo Go/52.0.0 (Builtins/1.0)
```

**Server-side handling**:
```typescript
// In bundle request handler
function shouldUseStdRuntime(req: Request): boolean {
  const hasBuiltins =
    req.query.builtins === '1' ||
    req.headers['x-expo-builtins-version'] ||
    req.headers['user-agent']?.includes('Builtins/');

  return hasBuiltins && env.EXPO_USE_STD_RUNTIME;
}
```

### 3. Additional Improvements

#### 3.1 Versioning System
Add version checking between built-ins and dev server to ensure compatibility:
```typescript
// In builtins bundle
globalThis.__EXPO_BUILTINS_VERSION__ = '1.0.0';

// Server checks version matches expected
if (runtime.builtinsVersion !== expectedVersion) {
  console.warn('Built-ins version mismatch, falling back to full bundle');
}
```

#### 3.2 Tree Shaking for Built-ins
Enable tree shaking when building the built-ins bundle to reduce size:
```
# apps/builtins/.env
EXPO_UNSTABLE_TREE_SHAKING=1
```

#### 3.3 Dynamic Built-ins Manifest
Generate the `builtins` list in `withMetroMultiPlatform.ts` from a manifest file rather than hardcoding:
```typescript
// builtins-manifest.json
{
  "version": "1.0.0",
  "modules": ["react", "react-native", ...],
  "internal": ["_react-native/...", ...]
}

// withMetroMultiPlatform.ts
import manifest from './builtins-manifest.json';
const builtins = manifest.modules;
```

#### 3.5 Source Maps for Built-ins
Currently source maps are disabled for built-ins (`EXPO_BUNDLE_BUILT_IN` removes sourceMappingURL). Consider generating and hosting source maps separately for debugging:
```typescript
// In ExpoGoRootViewFactory
runtime.evaluateJavaScript(buffer, "builtin.hbc", sourceMapUrl);
```

#### 3.7 Android Support
Implement equivalent built-ins loading on Android using the same pattern as iOS.

#### 3.8 Dev Tools Integration
Add dev tools support to inspect which modules are using built-ins vs bundled:
```typescript
// In dev mode, expose debugging info
if (__DEV__) {
  globalThis.__EXPO_BUILTINS_STATS__ = {
    loaded: [...loadedModules],
    available: [...builtinsList]
  };
}
```

#### 3.9 Graceful Fallback
If built-ins fail to load, the app should gracefully fall back to bundling all dependencies:
```objc
- (void)_loadBuiltinsIntoRuntime:(facebook::jsi::Runtime &)runtime
{
  @try {
    // Load builtins
  } @catch (NSException *exception) {
    // Set flag to tell dev server to send full bundle
    [self notifyDevServerBuiltinsFailed];
  }
}
```

#### 3.10 Built-ins Bundle Splitting
For very large built-ins, consider splitting into multiple bundles that can be loaded on demand:
- Core bundle: React, React Native essentials
- Navigation bundle: React Navigation packages
- Expo bundle: Expo SDK packages
