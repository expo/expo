import { useEffect, useState } from 'react';

import type { LocationProfile, Position } from '../types';
import { watchPosition } from './PositionWatchHandle';

export type UseWatchPositionOptions = {
  profile?: LocationProfile;
};

export type UseWatchPositionResult =
  | {
      position: Position;
      error: null;
    }
  | {
      position: null;
      error: string;
    }
  | {
      position: null;
      error: null;
    };

export function useWatchPosition({
  profile,
}: UseWatchPositionOptions = {}): UseWatchPositionResult {
  const [result, setResult] = useState<UseWatchPositionResult>({ position: null, error: null });

  useEffect(() => {
    setResult({ position: null, error: null });
    const handle = watchPosition({
      profile,
      onPosition: (position) => setResult({ position, error: null }),
      onError: (error) => setResult({ position: null, error }),
    });
    return () => handle.dispose();
  }, [profile]);

  return result;
}
