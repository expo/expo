import { CodedError } from 'expo';
import { useEffect, useState } from 'react';

import type { LocationProfile, Position, PositionWatchError } from '../types';
import { watchPosition, type PositionWatchHandle } from './PositionWatchHandle';

export type UseUserLocationOptions = {
  profile?: LocationProfile;
};

export type UseUserLocationResult =
  | {
      position: Position;
      error: null;
    }
  | {
      position: null;
      error: PositionWatchError;
    }
  | {
      position: null;
      error: null;
    };

export function useUserLocation({ profile }: UseUserLocationOptions = {}): UseUserLocationResult {
  const [result, setResult] = useState<UseUserLocationResult>({ position: null, error: null });

  useEffect(() => {
    setResult({ position: null, error: null });
    let handle: PositionWatchHandle;
    try {
      handle = watchPosition({
        profile,
        onPosition: (position) => setResult({ position, error: null }),
        onError: (error) => setResult({ position: null, error }),
      });
    } catch (error) {
      if (!(error instanceof CodedError)) {
        throw error;
      }
      setResult({ position: null, error: { code: error.code, message: error.message } });
      return;
    }
    return () => handle.dispose();
  }, [profile]);

  return result;
}
