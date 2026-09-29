import { Host as ComposeHost } from '@expo/ui/jetpack-compose';
import type { HostProps } from '@expo/ui/jetpack-compose';

import { withNativeHostBoundary } from '../hostContext';

export const Host = withNativeHostBoundary<HostProps>(ComposeHost);

export type { HostProps };
