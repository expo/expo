import * as React from 'react';
import { AppState, AppStateStatus } from 'react-native';

export default function useAppState() {
  const [state, setAppState] = React.useState(AppState.currentState);

  React.useEffect(() => {
    function onAppStateChanged(state: AppStateStatus) {
      setAppState(state);
    }

    AppState.addEventListener('change', onAppStateChanged);

    return () => {
      AppState.removeEventListener('change', onAppStateChanged);
    };
  }, []);

  return state;
}
