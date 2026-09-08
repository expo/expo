import type { DrawerNavigationState, DrawerStatus, ParamListBase } from '../../native';

/**
 * Returns the drawer's current status.
 *
 * @param defaultStatus Status returned when the state has no explicit drawer status.
 * @deprecated Use `useDrawerStatus` instead.
 */
export function getDrawerStatusFromState(
  state: DrawerNavigationState<ParamListBase>,
  defaultStatus: DrawerStatus
): DrawerStatus {
  return state.drawerStatus ?? defaultStatus;
}
