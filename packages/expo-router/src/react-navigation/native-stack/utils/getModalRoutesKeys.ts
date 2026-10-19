import { isModalPresentation } from '../../../utils/stackPresentation';
import type { Route } from '../../native';
import type { NativeStackDescriptorMap } from '../types';

export const getModalRouteKeys = (routes: Route<string>[], descriptors: NativeStackDescriptorMap) =>
  routes.reduce<string[]>((acc, route) => {
    const { presentation } = descriptors[route.key]?.options ?? {};

    if ((acc.length && !presentation) || isModalPresentation(descriptors[route.key]?.options)) {
      acc.push(route.key);
    }

    return acc;
  }, []);
