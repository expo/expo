import type {
  DrawerNavigationState,
  DrawerStatus,
  ParamListBase,
} from '@react-navigation/native';

export function getDrawerStatusFromState(
  state: DrawerNavigationState<ParamListBase>
): DrawerStatus {
  if (state.history == null) {
    throw new Error(
      "Couldn't find the drawer status in the state object. Is it a valid state object of drawer navigator?"
    );
  }

  const entry = state.history.findLast((it) => it.type === 'drawer') as
    | { type: 'drawer'; status: DrawerStatus }
    | undefined;

  return entry?.status ?? state.default ?? 'closed';
}
