import { createPermissionHook } from 'expo-modules-core';
import ExpoMaps from './ExpoMaps';
import * as AppleTypes from './apple/AppleMaps.types';
import { MapView as AppleMapsView } from './apple/AppleMapsView';
import * as GoogleTypes from './google/GoogleMaps.types';
import { MapView as GoogleMapsView } from './google/GoogleMapsView';
import { StreetView as GoogleStreetView } from './google/GoogleStreetView';
export var GoogleMaps;
(function (GoogleMaps) {
    GoogleMaps.View = GoogleMapsView;
    GoogleMaps.StreetView = GoogleStreetView;
    GoogleMaps.MapType = GoogleTypes.MapType;
    GoogleMaps.MapColorScheme = GoogleTypes.MapColorScheme;
})(GoogleMaps || (GoogleMaps = {}));
export var AppleMaps;
(function (AppleMaps) {
    AppleMaps.View = AppleMapsView;
    AppleMaps.MapType = AppleTypes.MapType;
})(AppleMaps || (AppleMaps = {}));
export const requestPermissionsAsync = ExpoMaps.requestPermissionsAsync;
export const getPermissionsAsync = ExpoMaps.getPermissionsAsync;
/**
 * Check or request permissions to access the location.
 * This uses both `requestPermissionsAsync` and `getPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = useLocationPermissions();
 * ```
 */
export const useLocationPermissions = createPermissionHook({
    getMethod: getPermissionsAsync,
    requestMethod: requestPermissionsAsync,
});
export * from './shared.types';
//# sourceMappingURL=index.js.map