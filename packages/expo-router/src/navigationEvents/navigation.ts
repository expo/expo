import { emit } from '.';
import { storeRef } from '../global-state/store';

let unsubscribe: (() => void) | undefined;

export function handleNavigationOnReady() {
  if (unsubscribe) unsubscribe();
  unsubscribe = storeRef.current.navigationRef.addListener('__unsafe_action__', (e) => {
    if (!e.data.noop && storeRef.current.state) {
      const action = e.data.action;
      emit('actionDispatched', {
        actionType: action.type,
        payload: action.payload,
        state: storeRef.current.state,
      });
    }
  });
}
