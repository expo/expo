import * as AppleTypes from './apple/AppleMaps.types';
import { AppleMapsView } from './apple/AppleMapsView';
import * as GoogleTypes from './google/GoogleMaps.types';
import { StreetView as GoogleStreetView } from './google/GoogleStreetView';
export declare namespace GoogleMaps {
    const View: import("react").ForwardRefExoticComponent<Omit<GoogleTypes.MapProps, "ref"> & import("react").RefAttributes<GoogleTypes.MapViewType>>;
    const StreetView: typeof GoogleStreetView;
    const MapType: typeof GoogleTypes.MapType;
    type MapType = GoogleTypes.MapType;
    const MapColorScheme: typeof GoogleTypes.MapColorScheme;
    type MapColorScheme = GoogleTypes.MapColorScheme;
    type Marker = GoogleTypes.Marker;
    type CameraPosition = GoogleTypes.CameraPosition;
    type MapUiSettings = GoogleTypes.MapUiSettings;
    type MapProperties = GoogleTypes.MapProperties;
    type MapProps = GoogleTypes.MapProps;
    type MapView = GoogleTypes.MapViewType;
}
export declare namespace AppleMaps {
    const View: typeof AppleMapsView;
    const MapType: typeof AppleTypes.MapType;
    type MapType = AppleTypes.MapType;
    type CameraPosition = AppleTypes.CameraPosition;
    type MapProperties = AppleTypes.MapProperties;
    type MapUiSettings = AppleTypes.MapUiSettings;
    type Marker = AppleTypes.Marker;
}
export declare const requestPermissionsAsync: () => Promise<import("expo-modules-core").PermissionResponse>;
export declare const getPermissionsAsync: () => Promise<import("expo-modules-core").PermissionResponse>;
/**
 * Check or request permissions to access the location.
 * This uses both `requestPermissionsAsync` and `getPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = useLocationPermissions();
 * ```
 */
export declare const useLocationPermissions: (options?: import("expo-modules-core").PermissionHookOptions<object> | undefined) => [import("expo-modules-core").PermissionResponse | null, () => Promise<import("expo-modules-core").PermissionResponse>, () => Promise<import("expo-modules-core").PermissionResponse>];
export * from './shared.types';
//# sourceMappingURL=index.d.ts.map