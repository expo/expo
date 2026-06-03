import { RNHostView as SwiftUIRNHostView } from '@expo/ui/swift-ui';

import { withReactNativeHostBoundary } from '../hostContext';
import type { RNHostViewProps } from './types';

/**
 * Hosts React Native views inside SwiftUI views.
 */
function RNHostViewContent({ children, matchContents }: RNHostViewProps) {
  return <SwiftUIRNHostView matchContents={matchContents}>{children}</SwiftUIRNHostView>;
}

export const RNHostView = withReactNativeHostBoundary<RNHostViewProps>(RNHostViewContent);

export * from './types';
