import * as React from 'react';

import { RouterRegistryProvider } from '../../../../global-state/routerRegistry';
import { BaseNavigationContainer as BaseNavigationContainerImpl } from '../../BaseNavigationContainer';

export function BaseNavigationContainer(
  props: React.ComponentProps<typeof BaseNavigationContainerImpl>
) {
  return (
    <RouterRegistryProvider>
      <BaseNavigationContainerImpl {...props} />
    </RouterRegistryProvider>
  );
}
