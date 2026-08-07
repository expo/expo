import type { DrawerNavigationState, DrawerStatus, ParamListBase, RenderState } from '../../native';

export function getDrawerStatusFromState(
  state: RenderState<DrawerNavigationState<ParamListBase>>
): DrawerStatus {
  if (state.history == null) {
    // The cast lets us diagnose a malformed fresh state, which the public type excludes.
    const isFresh = (state as { stale?: boolean }).stale === false;
    if (isFresh) {
      throw new Error(
        "Couldn't find the drawer status in the state object. Is it a valid state object of drawer navigator?"
      );
    }

    return state.default ?? 'closed';
  }

  const entry = state.history.findLast((it) => it.type === 'drawer') as
    | { type: 'drawer'; status: DrawerStatus }
    | undefined;

  return entry?.status ?? state.default ?? 'closed';
}
