export * as Location from './Location';

export {
  useLocationServices,
  useForegroundPermissions,
  useBackgroundPermissions,
  useWatchPosition,
  PositionWatchHandle,
  LocationProvider,
  LocationUpdatesHandle,
  type UseWatchPositionOptions,
  type UseWatchPositionResult,
} from './js';

export {
  LocationProfile,
  LocationAccuracy,
  LocationScope,
  RequestPermissionsAccuracyOption,
  type Coordinates,
  type Position,
  type PositionUpdate,
  type PositionWatchError,
  type PositionWatchStatus,
  type WatchPositionParams,
  type GetPositionOptions,
  type LocationPermissionResponse,
  type RequestPermissionsOptions,
  type LocationProviderRefType,
} from './types';
