import type { DrawerNavigationState, DrawerStatus, ParamListBase } from '../../native';

export function getDrawerStatusFromState(
  state: DrawerNavigationState<ParamListBase>
): DrawerStatus {
  const entry = state.history?.findLast((it) => it.type === 'drawer') as
    | { type: 'drawer'; status: DrawerStatus }
    | undefined;

  return entry?.status ?? state.default ?? 'closed';
}
