import type { Route } from '@react-navigation/native';

import type { StackDescriptorMap } from '../types';

export const getModalRouteKeys = (
  routes: Route<string>[],
  descriptors: StackDescriptorMap
) =>
  routes.reduce<string[]>((acc, route) => {
    const { presentation } = descriptors[route.key]?.options ?? {};

    if (
      (acc.length && !presentation) ||
      presentation === 'modal' ||
      presentation === 'transparentModal'
    ) {
      acc.push(route.key);
    }

    return acc;
  }, []);
