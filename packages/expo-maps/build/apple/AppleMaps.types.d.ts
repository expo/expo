import type { SharedRef as SharedRefType } from 'expo/types';
import type { StyleProp, ViewStyle } from 'react-native';
import { CameraPosition, Coordinates } from '../shared.types';
/**
 * @platform ios
 */
export type AppleMapsMarker = {
    /**
     * The SF Symbol to display for the marker.
     */
    systemImage?: string;
    /**
     * The coordinates of the marker.
     */
    coordinates?: Coordinates;
    /**
     * The title of the marker, displayed in the callout when the marker is clicked.
     */
    title?: string;
    /**
     * The tint color of the marker.
     */
    tintColor?: string;
};
/**
 * @platform ios
 */
export type AppleMapsUISettings = {
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
 * @platform ios
 */
export declare enum AppleMapsMapType {
    /**
     * A satellite image of the area with road and road name layers on top.
     */
    HYBRID = "HYBRID",
    /**
     * A street map that shows the position of all roads and some road names.
     */
    STANDARD = "STANDARD",
    /**
     * A satellite image of the area.
     */
    IMAGERY = "IMAGERY"
}
/**
 * @platform ios
 */
export type AppleMapsProperties = {
    /**
     * Whether the traffic layer is enabled on the map.
     */
    isTrafficEnabled?: boolean;
    /**
     * Defines which map type should be used.
     */
    mapType?: AppleMapsMapType;
    /**
     * If true, the user can select a location on the map to get more information.
     */
    selectionEnabled?: boolean;
};
/**
 * @platform ios
 */
export type AppleMapsAnnotation = {
    /**
     * The background color of the annotation.
     */
    backgroundColor?: string;
    /**
     * The text to display in the annotation.
     */
    text?: string;
    /**
     * The text color of the annotation.
     */
    textColor?: string;
    /**
     * The custom icon to display in the annotation.
     */
    icon?: SharedRefType<'image'>;
} & AppleMapsMarker;
/**
 * @platform ios
 */
export type AppleMapsViewProps = {
    style?: StyleProp<ViewStyle>;
    /**
     * The initial camera position of the map.
     */
    cameraPosition?: CameraPosition;
    /**
     * The array of markers to display on the map.
     */
    markers?: AppleMapsMarker[];
    /**
     * The array of annotations to display on the map.
     */
    annotations?: AppleMapsAnnotation[];
    /**
     * The `MapUiSettings` to be used for UI-specific settings on the map.
     */
    uiSettings?: AppleMapsUISettings;
    /**
     * The properties for the map.
     */
    properties?: AppleMapsProperties;
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
    onMarkerClick?: (event: AppleMapsMarker) => void;
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