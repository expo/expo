import { createContext, use, type ReactNode } from 'react';

/**
 * `true` when a navigator or screen above turns off the horizontal `SafeAreaView` that wraps each
 * leaf screen.
 */
export const DisableAutomaticHorizontalSafeAreaInsetsContext = createContext(false);

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
