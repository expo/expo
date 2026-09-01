import * as React from 'react';

import { NavigationContainer as NavigationContainerImpl } from '../../../../fork/NavigationContainer';
import { getStateFromPath, type ResultState } from '../../../../fork/getStateFromPath';
import { RemovalPreventionProvider } from '../../../../global-state/removalPrevention';
import { RouterRegistryProvider } from '../../../../global-state/routerRegistry';
import { RoutingQueueProvider } from '../../../../global-state/routingQueueContext';
import type { NavigationState } from '../../../routers';

type Props = React.ComponentProps<typeof NavigationContainerImpl> & {
  initialState?: NavigationState;
};

const initialStatePath = '/__test_initial_state__';

export const NavigationContainer = React.forwardRef(function NavigationContainer(
  { initialState, linking, ...props }: Props,
  ref: React.ForwardedRef<React.ElementRef<typeof NavigationContainerImpl>>
) {
  const linkingWithInitialState = initialState
    ? {
        prefixes: [],
        ...linking,
        getInitialURL: () => initialStatePath,
        getStateFromPath: (path: string, options: Parameters<typeof getStateFromPath>[1]) => {
          if (path === initialStatePath) {
            // This fixture bypasses parsing to inject an already-complete state.
            return initialState as unknown as ResultState;
          }

          return (linking?.getStateFromPath ?? getStateFromPath)(path, options);
        },
      }
    : linking;

  return (
    <RoutingQueueProvider>
      <RouterRegistryProvider>
        <RemovalPreventionProvider>
          <NavigationContainerImpl {...props} linking={linkingWithInitialState} ref={ref} />
        </RemovalPreventionProvider>
      </RouterRegistryProvider>
    </RoutingQueueProvider>
  );
});
