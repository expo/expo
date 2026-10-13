export * as Location from './Location';

export {
  useForegroundLocationPermissions,
  useBackgroundLocationPermissions,
  useLocationServices,
  PositionWatchHandle,
  LocationProvider,
  LocationUpdatesHandle,
  defineLocationTask,
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
  type LocationTaskOptions,
  type LocationPermissionResponse,
  type RequestPermissionsOptions,
  type LocationProviderRefType,
} from './types';
