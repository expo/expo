# Expo Router

File-based routing library for React Native and web applications. Built on top of React Navigation, it provides automatic route generation from file structure, deep linking, typed routes, and cross-platform navigation.

## Structure

```
├── src/
│   ├── index.tsx              # Main entry point
│   ├── exports.ts             # Public API exports
│   ├── ExpoRoot.tsx           # Root component wrapper
│   ├── Route.tsx              # Route node definitions and context
│   ├── hooks.ts               # Navigation hooks (useRouter, usePathname, etc.)
│   ├── imperative-api.tsx     # router object for imperative navigation
│   ├── types.ts               # TypeScript type definitions
│   │
│   ├── getRoutes.ts           # Metro require context → route tree conversion
│   ├── getRoutesCore.ts       # Core route parsing with specificity scoring
│   ├── getReactNavigationConfig.ts  # React Navigation config generation
│   ├── getLinkingConfig.ts    # Deep linking configuration
│   ├── matchers.tsx           # Route segment pattern matching
│   │
│   ├── global-state/          # State management
│   │   ├── router-store.tsx   # Zustand store for router state
│   │   ├── routing.ts         # Navigation queue and routing functions
│   │   ├── routeInfo.ts       # Current route information context
│   │   └── serverLocationContext.ts  # Server-side location context
│   │
│   ├── layouts/               # Navigation layouts
│   │   ├── Stack.tsx          # Native stack navigator export (used only for RSC support)
│   │   ├── StackClient.tsx    # Client-side stack implementation
│   │   ├── Stack.web.tsx      # Web-specific stack implementation
│   │   ├── Tabs.tsx           # JavaScript Tab navigator (bottom tabs from react-navigation)
│   │   ├── Drawer.tsx         # Drawer navigator
│   │   ├── withLayoutContext.tsx  # Layout context HOC
│   │   └── stack-utils/       # Stack utilities
│   │       ├── Agents.md  # Read this file before modifying components in this directory
│   │       ├── StackScreen.tsx, StackSearchBar.tsx  # Screen and search bar components
│   │       ├── screen/        # Title (StackScreenTitle) and BackButton (StackScreenBackButton)
│   │       └── toolbar/       # StackToolbar* components
│   │
│   ├── native-tabs/           # Native bottom tabs (iOS UITabBar, Android BottomNav)
│   │   ├── NativeTabs.tsx            # Assignment of Trigger and BottomAccessory to NativeTabs component
│   │   ├── NativeTabTrigger.tsx      # Tab trigger component for configuring individual tabs. Includes function which convert sub-components (Icon, Label, etc) to options.
│   │   ├── NativeTabsView.tsx        # Native implementation of tabs using React Native Screens
│   │   ├── NativeTabsView.web.tsx    # Web fallback implementation
│   │   ├── NativeBottomTabsNavigator.tsx  # Native bottom tabs navigator common for native and web. Utilizes useNavigationBuilder.
│   │   ├── NativeBottomTabsRouter.tsx     # Custom tab router extending TabRouter
│   │   ├── appearance.ts             # utilities for converting options to iOS appearance settings
│   │   ├── hooks.ts                  # usePlacement hook for BottomAccessory environments
│   │   ├── types.ts                  # NativeTabs types
│   │   ├── common/elements.tsx      # Common sub-components (Icon, Label, Badge, VectorIcon)
│   │   ├── utils/                  # Utilities for icons, label, bottom accessory, material icons
│   │   ├── __tests__/                # Platform-specific unit tests
│   │   └── __rsc_tests__/            # React Server Components tests
│   │
│   ├── link/                  # Link component
│   │   ├── Link.tsx           # Main Link component with Preview/Menu/Zoom
│   │   ├── href.ts            # Href resolution logic
│   │   ├── preview/           # Link preview UI (iOS peek/pop style)
│   │   └── zoom/              # Apple-style zoom transitions
│   │
│   ├── head/                  # On web a wrapper around react-helmet. On iOs a JS layer for ExpoHeadModule. On Android a no-op.
│   │
│   ├── ui/                    # Headless tabs components
│   │
│   ├── views/                 # Built-in screens
│   │   ├── Navigator.tsx      # Custom navigator with Slot
│   │   ├── ErrorBoundary.tsx  # Error handling
│   │   ├── Sitemap.tsx        # Route introspection
│   │   └── Unmatched.tsx      # 404 screen
│   │
│   ├── fork/                  # Forked React Navigation code
│   │   ├── NavigationContainer.tsx  # Custom NavigationContainer
│   │   ├── getStateFromPath.ts      # URL → navigation state
│   │   ├── getPathFromState.ts      # Navigation state → URL
│   │   └── native-stack/            # Native stack navigator fork
│   │
│   ├── color/                 # Platform color utilities
│   ├── primitives/            # UI components (Icon, Label, Badge)
│   ├── loaders/               # Data loader support (SSG and SSR)
│   ├── rsc/                   # React Server Components
│   ├── static/                # Static rendering and SSR support
│   ├── utils/                 # General utilities (font, splash, statusbar, url)
│   ├── testing-library/       # Testing utilities
│   └── __tests__/             # Jest tests
│
├── plugin/                    # Expo router config plugin
│   └── src/index.ts           # Plugin entry point
├── ios/                       # Native iOS code (Swift)
│   ├── ExpoHeadModule.swift           # NSUserActivity for Handoff, Spotlight, Siri
│   ├── ExpoHeadAppDelegateSubscriber.swift  # Deep link handling from Spotlight/Handoff
│   ├── LinkPreview/                   # iOS peek/pop preview and zoom transitions
│   ├── Toolbar/                       # Native toolbar components
│   └── RouterViewWithLogger.swift     # Base expo view with jsLogger integration
├── android/                   # Native Android code (Kotlin)
│   └── ExpoRouterModule.kt            # Material 3 dynamic and static color resolution
├── entry.js                   # Module entry point
├── head.js                    # Head/meta tags entrypoint - import Head from "expo-router/head"
├── server.js                  # Deprecated server entrypoint. Use @expo/server instead.
├── server.d.ts                # Re-exports types from `@expo/router-server`
├── drawer.js                  # Drawer navigator - import { Drawer } from "expo-router/drawer"
├── stack.js                   # Stack navigator - import { Stack } from "expo-router/stack"
├── tabs.js                    # Tab navigator - import { Tabs } from "expo-router/tabs"
├── html.js                    # HTML document wrapper for web - import { Html } from "expo-router/html"
├── ui.js                      # Headless UI tabs components - import { Tabs } from "expo-router/ui"
├── unstable-native-tabs.js    # Native bottom tabs - import { NativeTabs } from "expo-router/unstable-native-tabs"
├── unstable-split-view.js     # Split view layout - import { SplitView } from "expo-router/unstable-split-view"
├── testing-library.js         # Testing utilities - import { renderRouter } from "expo-router/testing-library"
└── build/                     # Compiled JavaScript output
```

## Testing

Run tests with jest-expo multi-platform presets:

```bash
# Run all tests
yarn test

# Run specific test file
yarn test src/__tests__/navigation.test.ios.tsx
```

To verify if the types used in tests are correct, run:

```bash
yarn test:types
```

### Testing Patterns

Tests use the custom `renderRouter` testing utility:

```typescript
import { renderRouter, screen } from '../testing-library';
import { router } from '../imperative-api';
import Stack from '../layouts/StackClient';
import { act } from '@testing-library/react-native';

it('can navigate between routes', () => {
  renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    'profile/[id]': () => <Text testID="profile">Profile</Text>,
  });

  expect(screen.getByTestId('index')).toBeVisible();

  act(() => router.push('/profile/123'));

  expect(screen.getByTestId('profile')).toBeVisible();
  expect(screen).toHavePathname('/profile/123');
});
```

**Key testing utilities:**

- `renderRouter(routes, options)` - Render router with mock route configuration
- `renderHook(callback, options)` - Test hooks with router context (re-exported from @testing-library/react-native)
- `screen.getPathname()` - Get current pathname
- `screen.getSegments()` - Get route segments array
- `screen.getSearchParams()` - Get search parameters
- `router.navigate/push/replace/back()` - Imperative navigation (from `imperative-api`)

**Platform-specific tests:**

- `.test.ios.tsx` - iOS tests
- `.test.android.tsx` - Android tests
- `.test.web.tsx` - Web tests
- `.test.node.ts` - Node.js tests

**RSC tests:** When adding new components, add RSC tests in `__rsc_tests__/` directories to verify they render correctly in React Server Components environment.

When testing native primitives, mock them in tests using `jest.mock()`. When adding mocks use `typeof import('module-name')` to preserve types and ensure path correctness. Example:

```ts
jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props) => <actualScreens.ScreenStackItem {...props} />),
  };
});
```

**Spies and console mocks:** Use `beforeEach`/`afterEach` with `mockRestore()`:

```ts
let spy: jest.SpyInstance;
beforeEach(() => {
  spy = jest.spyOn(Module, 'fn');
}); // or jest.spyOn(console, 'warn').mockImplementation(() => {})
afterEach(() => {
  spy.mockRestore();
});
```

**Mock call assertions:** Use array index access. Comment non-zero indices:

```ts
const props = MockedComponent.mock.calls[0][0];
// [1] because first call is layout, second is screen
const screenProps = MockedComponent.mock.calls[1][0];
```

## Key Concepts

### File-Based Routing Conventions

- `page/index.tsx` → `/page`
- `post/[id].tsx` → `/post/:id` (dynamic segment)
- `[...rest].tsx` → catch-all route
- `(group)/_layout.tsx` → layout group (invisible in URL)
- `+not-found.tsx` → 404 handling
- `+api.ts` → API route

**Related package:** `@expo/router-server` contains server-side rendering and API route handling utilities used by `expo-router/server`.

### Route Processing Pipeline

1. Metro `require.context()` collects route files at build time
2. `getRoutes()` converts file paths to `RouteNode` tree
3. `getReactNavigationConfig()` generates React Navigation config
4. `getLinkingConfig()` creates deep linking configuration
5. The linking is then injected into `NavigationContainer` ExpoRoot.tsx

### State Management

- **RouterStore** (`global-state/router-store.tsx`): The global store managing navigation state, and making it accessible imperatively via the `store` object
- **Routing Queue** (`global-state/routing.ts`): Batches navigation actions and processes them sequentially

### Platform-Specific Code

Use file extensions for platform variants:

- `.ios.tsx` - iOS-specific
- `.android.tsx` - Android-specific
- `.web.tsx` - Web-specific
- `.native.tsx` - iOS + Android

Examples: `ExpoHead.ios.tsx`, `NativeTabsView.web.tsx`, `useBackButton.native.ts`

### Native Tabs

Native tabs (`expo-router/unstable-native-tabs`) provide native bottom tab navigation using iOS UITabBar and Android Material BottomNavigation via `react-native-screens`.

- `NativeTabs` - Layout component using `useNavigationBuilder` with custom `NativeBottomTabsRouter`
- `NativeTabs.Trigger` - Tab configuration (icon, label, badge) via declarative children
- `NativeTabs.BottomAccessory` - iOS 26+ bottom accessory with `usePlacement` hook for inline/regular modes
- Icons: `sf` (SF Symbols), `drawable` (Android resources), `md` (Material icons), `src` (images)
- iOS-specific: blur effects, scroll edge transparency, sidebar adaptable (iPadOS 18+), minimize behaviors (iOS 26+)
- Android-specific: Material Design 3 dynamic colors, ripple effects, indicator customization

### E2E Testing (router-e2e)

The `apps/router-e2e` app contains end-to-end tests and examples for Expo Router. Different apps are in `__e2e__/` subdirectory.

**Running tests/apps:**

- From `packages/@expo/cli`: `yarn test:e2e <PROJECT_NAME>` or `yarn test:playwright <PROJECT_NAME>`
- Maestro tests (native navigation): `yarn test:e2e` from `apps/router-e2e`
- Some of the apps are only for manual testing

## Verification

After developing a feature, run these commands in `packages/expo-router`:

1. `CI=1 yarn test` - Run all tests. During development use `yarn test [test file]` for efficiency. For RSC tests: `yarn test:rsc`
2. `yarn build` - Build and verify TypeScript correctness. If you moved or deleted files, run `yarn clean` first.
3. `yarn test:types` - Verify type correctness in tests
4. `yarn lint` - Run last to find linting issues

When adding dependencies or changing static/server rendering, run e2e tests in `packages/@expo/cli` (time-consuming, run only when necessary).

## Documentation

There are two types of documentation for Expo Router:

- **Guides** - mdx files in the `docs/` directory of the monorepo, covering concepts, tutorials, and how-tos.
- **API Reference** - Generated from TypeScript types using `typedoc`

When developing new features, make sure that both guides and API reference are updated accordingly.

To update API reference, run:

```bash
et generate-docs-api-data --packageName expo-router
```

You can run this command for specific sdk if asked:

```bash
et generate-docs-api-data --packageName expo-router --sdk <VERSION>
```

### Testing docs changes

To run the docs site locally run `yarn dev` in the `docs/` directory of the monorepo. The reference will be available at:

- http://localhost:3002/versions/unversioned/sdk/router/ for main router
- http://localhost:3002/versions/unversioned/sdk/router-native-tabs/ for native tabs
- http://localhost:3002/versions/unversioned/sdk/router-split-view/ for split view
- http://localhost:3002/versions/unversioned/sdk/router-ui/ for headless tabs

## Coding style

- Always use latest React 19 hooks and patterns - `use` instead of `useContext`, `useId`, etc.
- Make sure the code works with and without React Compiler enabled.
- Don't use `any` types, unless strictly necessary. Use `unknown` instead and narrow types as much as possible.
- Never import files with platform-specific extensions directly. Always import from the base path and let the bundler resolve the correct file. Correct `import { Component } from './Component'`, not `import { Component } from './Component.ios'`.

## Maintaining This Document

When developing or planning features, document missing behaviors in this file. Update sections when implementations change or new patterns emerge.
