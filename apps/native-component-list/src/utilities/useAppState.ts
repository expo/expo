import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export default function useAppState(
  initialState: AppStateStatus | null = AppState.currentState
): AppStateStatus | null {
  const [state, setState] = useState<AppStateStatus | null>(initialState);

  useEffect(() => {
    AppState.addEventListener('change', setState);
    return () => AppState.removeEventListener('change', setState);
  }, []);

  return state;
}
