import { createContext, use, type ReactNode } from 'react';

let enabled = false;

/**
 * Wraps each screen in a `SafeAreaView` with left and right insets. Call it before the root layout
 * mounts, for example at the top level of the root `_layout` file.
 *
 * Set `disableAutomaticHorizontalSafeAreaInsets` on a navigator or a screen to turn the insets off
 * for that part of the app. When this function is not called, set
 * `disableAutomaticHorizontalSafeAreaInsets` to `false` to turn the insets on for that part of the
 * app.
 *
 * @platform android
 * @platform ios
 */
export function enableAutomaticHorizontalSafeAreaInsets() {
  enabled = true;
}

/**
 * `true` when a navigator or screen above turns off the horizontal `SafeAreaView` that wraps each
 * leaf screen. `undefined` when nothing above sets it.
 */
export const DisableAutomaticHorizontalSafeAreaInsetsContext = createContext<boolean | undefined>(
  undefined
);

// Keeps the value from above when `value` is `undefined`.
export function DisableAutomaticHorizontalSafeAreaInsetsProvider({
  value,
  children,
}: {
  value: boolean | undefined;
  children: ReactNode;
}) {
  const inherited = use(DisableAutomaticHorizontalSafeAreaInsetsContext);
  return (
    <DisableAutomaticHorizontalSafeAreaInsetsContext value={value ?? inherited}>
      {children}
    </DisableAutomaticHorizontalSafeAreaInsetsContext>
  );
}

// Read at render time, because the root layout can call the function after this module loads.
export function useDisableAutomaticHorizontalSafeAreaInsets() {
  return use(DisableAutomaticHorizontalSafeAreaInsetsContext) ?? !enabled;
}
