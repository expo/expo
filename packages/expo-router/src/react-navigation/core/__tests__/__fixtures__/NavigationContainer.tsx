import * as React from 'react';

import { NavigationContainer as NavigationContainerImpl } from '../../../../fork/NavigationContainer';
import { RouterRegistryProvider } from '../../../../global-state/routerRegistry';

export const NavigationContainer = React.forwardRef(function NavigationContainer(
  props: React.ComponentProps<typeof NavigationContainerImpl>,
  ref: React.ForwardedRef<React.ElementRef<typeof NavigationContainerImpl>>
) {
  return (
    <RouterRegistryProvider>
      <NavigationContainerImpl {...props} ref={ref} />
    </RouterRegistryProvider>
  );
});
