import * as AppleTypes from './apple/AppleMaps.types';
import * as GoogleTypes from './google/GoogleMaps.types';
import { GoogleStreetView } from './google/GoogleStreetView';
/**
 * @hidden
 */
export declare namespace GoogleMaps {
    const View: import("react").ForwardRefExoticComponent<Omit<GoogleTypes.GoogleMapsViewProps, "ref"> & import("react").RefAttributes<GoogleTypes.GoogleMapsViewType>>;
    const StreetView: typeof GoogleStreetView;
    const MapType: typeof GoogleTypes.GoogleMapsMapType;
    type MapType = GoogleTypes.GoogleMapsMapType;
    const MapColorScheme: typeof GoogleTypes.GoogleMapsColorScheme;
    type MapColorScheme = GoogleTypes.GoogleMapsColorScheme;
    type Marker = GoogleTypes.GoogleMapsMarker;
    type MapUISettings = GoogleTypes.GoogleMapsUISettings;
    type MapProperties = GoogleTypes.GoogleMapsProperties;
    type MapProps = GoogleTypes.GoogleMapsViewProps;
    type MapView = GoogleTypes.GoogleMapsViewType;
    type StreetViewProps = GoogleTypes.GoogleStreetViewProps;
}
/**
 * @hidden
 */
export declare namespace AppleMaps {
    const View: import("react").ForwardRefExoticComponent<Omit<AppleTypes.AppleMapsViewProps, "ref"> & import("react").RefAttributes<AppleTypes.AppleMapsViewType>>;
    const MapType: typeof AppleTypes.AppleMapsMapType;
    type MapType = AppleTypes.AppleMapsMapType;
    type Marker = AppleTypes.AppleMapsMarker;
    type MapUISettings = AppleTypes.AppleMapsUISettings;
    type MapProperties = AppleTypes.AppleMapsProperties;
    type MapProps = AppleTypes.AppleMapsViewProps;
    type MapView = AppleTypes.AppleMapsViewType;
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