import type { NavigationAction } from '../../native';
import { StackActions } from '../../native';

export function makePopAction(dispatch: (action: NavigationAction) => void, stateKey: string) {
  return (count: number, sourceRouteKey: string) => {
    dispatch({
      ...StackActions.pop(count),
      source: sourceRouteKey,
      target: stateKey,
    });
  };
}
