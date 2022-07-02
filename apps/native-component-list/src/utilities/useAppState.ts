import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export default function useAppState(
  initialState: AppStateStatus | null = AppState.currentState
): AppStateStatus | null {
  const [state, setState] = useState<AppStateStatus | null>(initialState);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', setState);
    return () => appStateSubscription.remove();
  }, []);

  return state;
}
