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
export declare enum MapColorScheme {
    LIGHT = "LIGHT",
    DARK = "DARK",
    FOLLOW_SYSTEM = "FOLLOW_SYSTEM"
}
export type ExpoMapsProps = {
    cameraPosition?: CameraPosition;
    markers?: Marker[];
    uiSettings?: MapUiSettings;
    properties?: MapProperties;
    style?: StyleProp<ViewStyle>;
    colorScheme?: MapColorScheme;
    onMapClick?: (event: {
        coordinates: Coordinates;
    }) => void;
    onPOIClick?: (event: {
        name: string;
        coordinates: Coordinates;
    }) => void;
    onMarkerClick?: (event: Marker) => void;
};
//# sourceMappingURL=ExpoMapsView.types.d.ts.map