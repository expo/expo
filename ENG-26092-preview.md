# ENG-26092 — Screen error boundaries

Implemented configurable error boundaries that preserve navigator chrome when a route throws.

## API

```tsx
export const unstable_settings = {
  screenErrorBoundary: AppScreenBoundary,
};

<Stack screenErrorBoundary={StackBoundary}>
  <Stack.Screen name="profile" errorBoundary={ProfileBoundary} />
</Stack>;
```

Route-level `export function ErrorBoundary()` remains the most specific boundary. The remaining precedence is `Stack.Screen.errorBoundary`, navigator `screenErrorBoundary`, then the nearest layout's `unstable_settings.screenErrorBoundary`.

## What changed

- Added layout and navigator boundary contexts, resolved at the route's existing suspense boundary.
- Added navigator and screen props across standard navigators, custom `Navigator`/`Slot`, and Native Tabs.
- Kept boundary-only props out of React Navigation's screen and navigator props.
- Added documentation and focused iOS tests for layout, navigator, and screen precedence.

## Representative diff

```diff
 type ScreenProps = {
+  errorBoundary?: ComponentType<ErrorBoundaryProps>;
 };

-<WrappedScreenComponent {...props} />
+<Try catch={navigatorBoundary ?? layoutBoundary}>
+  <WrappedScreenComponent {...props} />
+</Try>
```

## Verification

- `pnpm lint` — passed
- `pnpm build` — blocked by an existing duplicate `expo` global declaration from both the source checkout and this worktree's linked `expo-modules-core` package.
- `pnpm test src/__tests__/ScreenErrorBoundary.test.ios.tsx --runInBand` — blocked before executing tests because `react-native-safe-area-context` requires `__fbBatchedBridgeConfig`; the existing `SuspenseFallback.test.ios.tsx` fails at the identical initialization step in this worktree.
