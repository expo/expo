import { Host as SwiftUIHost } from '@expo/ui/swift-ui';
import type { HostProps } from '@expo/ui/swift-ui';

import { withNativeHostBoundary } from '../hostContext';

export const Host = withNativeHostBoundary<HostProps>(SwiftUIHost);

export type { HostProps };
