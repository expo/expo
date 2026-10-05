export * as Location from './Location';

export {
  useForegroundLocationPermissions,
  useBackgroundLocationPermissions,
  useLocationServices,
  useUserLocation,
  PositionWatchHandle,
  LocationProvider,
  LocationUpdatesHandle,
  defineLocationTask,
  type UseUserLocationOptions,
  type UseUserLocationResult,
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
