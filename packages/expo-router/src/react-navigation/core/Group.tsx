import type { ParamListBase } from '../routers';
import type { RouteGroupConfig } from './types';

/**
 * Empty component used for grouping screen configs.
 */
export function Group<ParamList extends ParamListBase, ScreenOptions extends object, Navigation>(
  _: RouteGroupConfig<ParamList, ScreenOptions, Navigation>
) {
  /* istanbul ignore next */
  return null;
}
