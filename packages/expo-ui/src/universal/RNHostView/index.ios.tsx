import { RNHostView as SwiftUIRNHostView } from '@expo/ui/swift-ui';

import type { RNHostViewProps } from './types';

/**
 * Hosts React Native views inside SwiftUI views.
 */
export function RNHostView({ children, matchContents }: RNHostViewProps) {
  return <SwiftUIRNHostView matchContents={matchContents}>{children}</SwiftUIRNHostView>;
}

export * from './types';
