import { Platform } from 'react-native';

import type { PagerViewProps } from './types';

/**
 * A drop-in replacement for `react-native-pager-view`. Renders a horizontally
 * paged view backed by Jetpack Compose's `HorizontalPager` on Android and
 * SwiftUI on iOS. Each child is treated as a separate page.
 */
export function PagerView(_props: PagerViewProps): never {
  throw new Error(
    `@expo/ui/community/pager-view is not implemented on ${Platform.OS}. Supported platforms: android, ios.`
  );
}
