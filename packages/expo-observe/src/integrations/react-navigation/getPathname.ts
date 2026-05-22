import {
  getPathFromState,
  type LinkingOptions,
  type NavigationState,
  type ParamListBase,
} from '@react-navigation/native';

import type { GetPathname } from './types';

export function createGetPathname<ParamList extends ParamListBase>(
  linking: LinkingOptions<ParamList> | undefined
): GetPathname {
  if (!linking?.config) {
    return (_state) => undefined;
  }
  return (state) => {
    if (!state) return undefined;
    // `LinkingOptions['config'].initialRouteName` is typed `keyof ParamList`,
    // while `getPathFromState`'s `Options['initialRouteName']` is `string`.
    // The shapes are structurally compatible — the cast bridges this gap in
    // react-navigation's own typings.
    return getPathFromState(
      state as unknown as NavigationState,
      linking.config as Parameters<typeof getPathFromState>[1]
    );
  };
}
