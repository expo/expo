import type { ParamListBase } from '@react-navigation/routers';

import type { RouteGroupConfig } from './types';

/**
 * Empty component used for grouping screen configs.
 */
export function Group<
  ParamList extends ParamListBase,
  ScreenOptions extends {},
  Navigation,
>(_: RouteGroupConfig<ParamList, ScreenOptions, Navigation>) {
  /* istanbul ignore next */
  return null;
}
