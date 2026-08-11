import type { DrawerNavigationState, DrawerStatus, ParamListBase } from '../../native';

/**
 * Returns the drawer's current status.
 *
 * @param defaultStatus Status returned when the state has no drawer history entry.
 * @deprecated Use `useDrawerStatus` instead.
 */
export function getDrawerStatusFromState(
  state: DrawerNavigationState<ParamListBase>,
  defaultStatus: DrawerStatus = 'closed'
): DrawerStatus {
  const entry = (state.history ?? []).findLast((it) => it.type === 'drawer') as
    | { type: 'drawer'; status: DrawerStatus }
    | undefined;

  return entry?.status ?? defaultStatus;
}
