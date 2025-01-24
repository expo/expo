import type { SharedRef as SharedRefType } from 'expo/types';
import type { StyleProp, ViewStyle } from 'react-native';
import { Coordinates } from '../shared.types';
export type Marker = {
    /**
     * The coordinates of the marker.
     */
    coordinates?: Coordinates;
    /**
     * The title of the marker, displayed in the callout when the marker is clicked.
     */
    title?: string;
    /**
     * The custom icon to display for the marker.
     */
    icon?: SharedRefType<'image'>;
};
export type CameraPosition = {
    /**
     * The middle point of the camera.
     */
    coordinates?: Coordinates;
    /**
     * The zoom level of the camera.
     * For some view sizez, lower zoom levels might not be available.
     */
    zoom?: number;
};
export type MapUiSettings = {
    /**
     * Whether the compass is enabled on the map.
     * If enabled, the compass is only visible when the map is rotated.
     */
    compassEnabled?: boolean;
    /**
     * Whether the my location button is visible.
     */
    myLocationButtonEnabled?: boolean;
    /**
     * Whether the scale bar is displayed when zooming.
     */
    scaleBarEnabled?: boolean;
    /**
     * Whether the user is allowed to change the pitch type.
     */
    togglePitchEnabled?: boolean;
};
/**
 * The type of map to display.
 */
export declare enum MapType {
    /**
     * Satellite imagery with roads and points of interest overlayed.
     */
    HYBRID = "HYBRID",
    /**
     * Standard road map.
     */
    STANDARD = "STANDARD",
    /**
     * Satellite imagery.
     */
    IMAGERY = "IMAGERY"
}
export type MapProperties = {
    /**
     * Whether the traffic layer is enabled on the map.
     */
    isTrafficEnabled?: boolean;
    /**
     * Defines which map type should be used.
     */
    mapType?: MapType;
    /**
     * If true, the user can select a location on the map to get more information.
     */
    selectionEnabled?: boolean;
};
export type Annotation = {
    backgroundColor?: string;
    text?: string;
    textColor?: string;
} & Marker;
export type MapProps = {
    style?: StyleProp<ViewStyle>;
    /**
     * The initial camera position of the map.
     */
    cameraPosition?: CameraPosition;
    /**
     * The array of markers to display on the map.
     */
    markers?: Marker[];
    /**
     * The array of annotations to display on the map.
     */
    annotations?: Annotation[];
    /**
     * The `MapUiSettings` to be used for UI-specific settings on the map.
     */
    uiSettings?: MapUiSettings;
    /**
     * The properties for the map.
     */
    properties?: MapProperties;
    /**
     * Lambda invoked when the user clicks on the map.
     * It won't be invoked if the user clicks on POI or a marker.
     */
    onMapClick?: (event: {
        coordinates: Coordinates;
    }) => void;
    /**
     * Lambda invoked when the marker is clicked
     */
    onMarkerClick?: (event: Marker) => void;
    /**
     * Lambda invoked when the map was moved by the user.
     */
    onCameraMove?: (event: {
        coordinates: Coordinates;
        zoom: number;
        tilt: number;
        bearing: number;
    }) => void;
};
//# sourceMappingURL=AppleMaps.types.d.ts.map