import type { StyleProp, ViewStyle } from 'react-native';
export type Coordinates = {
    latitude?: number;
    longitude?: number;
};
export type Marker = {
    coordinates?: Coordinates;
    title?: string;
    snippet?: string;
    draggable?: boolean;
};
export type CameraPosition = {
    coordinates?: Coordinates;
    zoom?: number;
};
export type MapUiSettings = {
    compassEnabled?: boolean;
    indoorLevelPickerEnabled?: boolean;
    mapToolbarEnabled?: boolean;
    myLocationButtonEnabled?: boolean;
    rotationGesturesEnabled?: boolean;
    scrollGesturesEnabled?: boolean;
    scrollGesturesEnabledDuringRotateOrZoom?: boolean;
    tiltGesturesEnabled?: boolean;
    zoomControlsEnabled?: boolean;
    zoomGesturesEnabled?: boolean;
};
export declare enum MapType {
    HYBRID = "HYBRID",
    NORMAL = "NORMAL",
    SATELLITE = "SATELLITE",
    TERRAIN = "TERRAIN"
}
export type MapProperties = {
    isBuildingEnabled?: boolean;
    isIndoorEnabled?: boolean;
    isMyLocationEnabled?: boolean;
    isTrafficEnabled?: boolean;
    mapType?: MapType;
    maxZoomPreference?: number;
    minZoomPreference?: number;
};
export type ExpoMapsProps = {
    cameraPosition?: CameraPosition;
    markers?: Marker[];
    uiSettings?: MapUiSettings;
    properties?: MapProperties;
    style?: StyleProp<ViewStyle>;
};
//# sourceMappingURL=ExpoMapsView.types.d.ts.map