import { createPermissionHook } from 'expo-modules-core';
import ExpoMaps from './ExpoMaps';
import * as AppleTypes from './apple/AppleMaps.types';
import { AppleMapsView } from './apple/AppleMapsView';
import * as GoogleTypes from './google/GoogleMaps.types';
import { GoogleMapsView } from './google/GoogleMapsView';
import { GoogleStreetView } from './google/GoogleStreetView';
/**
 * @hidden
 */
export var GoogleMaps;
(function (GoogleMaps) {
    GoogleMaps.View = GoogleMapsView;
    GoogleMaps.StreetView = GoogleStreetView;
    GoogleMaps.MapType = GoogleTypes.GoogleMapsMapType;
    GoogleMaps.MapColorScheme = GoogleTypes.GoogleMapsColorScheme;
})(GoogleMaps || (GoogleMaps = {}));
/**
 * @hidden
 */
export var AppleMaps;
(function (AppleMaps) {
    AppleMaps.View = AppleMapsView;
    AppleMaps.MapType = AppleTypes.AppleMapsMapType;
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