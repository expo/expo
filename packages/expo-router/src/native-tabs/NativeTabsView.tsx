/**
 * TypeScript / non-native fallback. The real implementations live in
 * `NativeTabsView.ios.tsx`, `NativeTabsView.android.tsx`, and
 * `NativeTabsView.web.tsx`
 */
import type { NativeTabsViewProps } from './types';

export function NativeTabsView(_props: NativeTabsViewProps): null {
  throw new Error(
    'You are using NativeTabs on unsupported platform. This is likely an internal Expo Router bug.'
  );
}
