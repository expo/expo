import type { Route } from '../../native';
import type { StackViewDescriptorMap } from '../types';

export const getModalRouteKeys = (routes: Route<string>[], descriptors: StackViewDescriptorMap) =>
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
