import { CodedError } from 'expo';
import { useEffect, useState } from 'react';

import type {
  LocationPermissionResponse,
  LocationProfile,
  Position,
  PositionWatchError,
  RequestPermissionsAccuracyOption,
} from '../types';
import { useForegroundLocationPermissions } from './Permissions';
import { watchPosition, type PositionWatchHandle } from './PositionWatchHandle';

export type UseUserLocationOptions = {
  accuracy?: RequestPermissionsAccuracyOption;
  profile?: LocationProfile;
};

type WatchResult =
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

export type UseUserLocationResult = WatchResult & {
  permission: LocationPermissionResponse | null;
  requestPermission: () => Promise<LocationPermissionResponse>;
};

export function useUserLocation(options: UseUserLocationOptions = {}): UseUserLocationResult {
  const { accuracy, profile } = options;
  const [permission, requestPermission] = useForegroundLocationPermissions({ accuracy });
  const [result, setResult] = useState<WatchResult>({ position: null, error: null });
  const granted = permission?.granted ?? false;

  useEffect(() => {
    setResult({ position: null, error: null });
    if (!granted) {
      return;
    }
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
  }, [granted, profile]);

  return { ...result, permission, requestPermission };
}
