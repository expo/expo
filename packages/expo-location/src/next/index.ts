export * as Location from './Location';

export {
  useForegroundLocationPermissions,
  useBackgroundLocationPermissions,
  useNotificationPermissions,
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
  type LocationPermissionResponse,
  type RequestPermissionsOptions,
  type LocationProviderRefType,
  BackgroundSessionState,
  type BackgroundSessionOptions,
  type BackgroundSessionStatus,
  type BackgroundTaskStatus,
} from './types';
