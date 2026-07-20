import { emit } from '.';
import { store } from '../global-state/store';

let unsubscribe: (() => void) | undefined;

export function handleNavigationOnReady() {
  if (unsubscribe) unsubscribe();
  unsubscribe = store.navigationRef.addListener('__unsafe_action__', (e) => {
    const state = store.state;
    if (!e.data.noop && state) {
      const action = e.data.action;
      emit('actionDispatched', {
        actionType: action.type,
        payload: action.payload,
        state,
      });
    }
  });
}
