import type { SharedRefType } from 'expo';
import type { Ref } from 'react';
import type { ProcessedColorValue, StyleProp, ViewStyle } from 'react-native';
import { CameraPosition, Coordinates } from '../shared.types';
/**
 * @platform android
 */
export type GoogleMapsAnchor = {
    /**
     * The normalized horizontal anchor point from 0.0 (left edge) to 1.0 (right edge).
     */
    x: number;
    /**
     * The normalized vertical anchor point from 0.0 (top edge) to 1.0 (bottom edge).
     */
    y: number;
};
/**
 * @platform android
 */
export type GoogleMapsMarker = {
    /**
     * The unique identifier for the marker. This can be used to identify the clicked marker in the `onMarkerClick` event.
     */
    id?: string;
    /**
     * The coordinates of the marker.
     */
    coordinates?: Coordinates;
    /**
     * The title of the marker, displayed in the callout when the marker is clicked.
     */
    title?: string;
    /**
     * The snippet of the marker, displayed in the callout when the marker is clicked.
     */
    snippet?: string;
    /**
     * Whether the marker is draggable.
     */
    draggable?: boolean;
    /**
     * Whether the callout should be shown when the marker is clicked.
     */
    showCallout?: boolean;
    /**
     * The custom icon to display for the marker.
     */
    icon?: SharedRefType<'image'>;
    /**
     * The anchor used to position the anchor relative to its coordinates.
     * @default bottom-center of the icon
     */
    anchor?: GoogleMapsAnchor;
    /**
     * The z-index to use for the marker.
     * @default 0
     */
    zIndex?: number;
};
/**
 * @platform android
 */
export type GoogleMapsPolyline = {
    /**
     * The unique identifier for the polyline. This can be used to identify the clicked polyline in the `onPolylineClick` event.
     */
    id?: string;
    /**
     * The coordinates of the polyline.
     */
    coordinates: Coordinates[];
    /**
     * The color of the polyline.
     */
    color?: ProcessedColorValue | string;
    /**
     * The width of the polyline.
     */
    width?: number;
    /**
     * Whether the polyline is geodesic.
     */
    geodesic?: boolean;
};
/**
 * @platform android
 */
export type GoogleMapsCircle = {
    /**
     * The unique identifier for the circle. This can be used to identify the clicked circle in the `onCircleClick` event.
     */
    id?: string;
    /**
     * The coordinates of the circle.
     */
    center: Coordinates;
    /**
     * The radius of the circle.
     */
    radius: number;
    /**
     * The color of the circle.
     */
    color?: ProcessedColorValue | string;
    /**
     * The color of the circle line.
     */
    lineColor?: ProcessedColorValue | string;
    /**
     * The width of the circle line.
     */
    lineWidth?: number;
};
/**
 * @platform android
 */
export type GoogleMapsPolygon = {
    /**
     * The unique identifier for the polygon. This can be used to identify the clicked polygon in the `onPolygonClick` event.
     */
    id?: string;
    /**
     * The coordinates of the circle.
     */
    coordinates: Coordinates[];
    /**
     * The color of the polygon.
     */
    color?: ProcessedColorValue | string;
    /**
     * The width of the polygon.
     */
    lineWidth?: number;
    /**
     * The color of the polygon.
     */
    lineColor?: ProcessedColorValue | string;
};
/**
 * @platform android
 */
export type GoogleMapsContentPadding = {
    /**
     * In LTR contexts, `start` will be applied along the left edge. In RTL contexts, `start` will correspond to the right edge.
     */
    start?: number;
    /**
     * In LTR contexts, `end` will be applied along the right edge. In RTL contexts, `end` will correspond to the left edge.
     */
    end?: number;
    /**
     * The padding on the top side of the map.
     */
    top?: number;
    /**
     * The padding on the bottom side of the map.
     */
    bottom?: number;
};
/**
 * @platform android
 */
export type GoogleMapsUserLocation = {
    /**
     * User location coordinates.
     */
    coordinates: Coordinates;
    /**
     * Should the camera follow the users' location.
     */
    followUserLocation: boolean;
};
/**
 * @platform android
 */
export type GoogleMapsUISettings = {
    /**
     * Whether the compass is enabled on the map.
     * If enabled, the compass is only visible when the map is rotated.
     */
    compassEnabled?: boolean;
    /**
     * Whether the indoor level picker is enabled .
     */
    indoorLevelPickerEnabled?: boolean;
    /**
     * Whether the map toolbar is visible.
     */
    mapToolbarEnabled?: boolean;
    /**
     * Whether the my location button is visible.
     */
    myLocationButtonEnabled?: boolean;
    /**
     * Whether rotate gestures are enabled.
     */
    rotationGesturesEnabled?: boolean;
    /**
     * Whether the scroll gestures are enabled.
     */
    scrollGesturesEnabled?: boolean;
    /**
     * Whether the scroll gestures are enabled during rotation or zoom.
     */
    scrollGesturesEnabledDuringRotateOrZoom?: boolean;
    /**
     * Whether the tilt gestures are enabled.
     */
    tiltGesturesEnabled?: boolean;
    /**
     * Whether the zoom controls are visible.
     */
    zoomControlsEnabled?: boolean;
    /**
     * Whether the zoom gestures are enabled.
     */
    zoomGesturesEnabled?: boolean;
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
 * @platform android
 */
export declare enum GoogleMapsMapType {
    /**
     * Satellite imagery with roads and points of interest overlayed.
     */
    HYBRID = "HYBRID",
    /**
     * Standard road map.
     */
    NORMAL = "NORMAL",
    /**
     * Satellite imagery.
     */
    SATELLITE = "SATELLITE",
    /**
     * Topographic data.
     */
    TERRAIN = "TERRAIN"
}
/**
 * @platform android
 */
export type GoogleMapsMapStyleOptions = {
    /**
     * The JSON string of the map style options.
     * @see For creating map style options, see https://mapstyle.withgoogle.com/
     */
    json: string;
};
/**
 * @platform android
 */
export type GoogleMapsProperties = {
    /**
     * Whether the building layer is enabled on the map.
     */
    isBuildingEnabled?: boolean;
    /**
     * Whether the indoor layer is enabled on the map.
     */
    isIndoorEnabled?: boolean;
    /**
     * Whether finding the user's location is enabled on the map.
     */
    isMyLocationEnabled?: boolean;
    /**
     * Whether the traffic layer is enabled on the map.
     */
    isTrafficEnabled?: boolean;
    /**
     * Defines which map type should be used.
     */
    mapType?: GoogleMapsMapType;
    /**
     * If true, the user can select a location on the map to get more information.
     */
    selectionEnabled?: boolean;
    /**
     * The maximum zoom level for the map.
     */
    maxZoomPreference?: number;
    /**
     * The minimum zoom level for the map.
     */
    minZoomPreference?: number;
    /**
     * With style options you can customize the presentation of the standard Google map styles, changing the visual display of features like roads, parks, and other points of interest.
     */
    mapStyleOptions?: GoogleMapsMapStyleOptions;
};
/**
 * @platform android
 */
export declare enum GoogleMapsColorScheme {
    LIGHT = "LIGHT",
    DARK = "DARK",
    FOLLOW_SYSTEM = "FOLLOW_SYSTEM"
}
/**
 * @platform android
 */
export type GoogleMapsMapOptions = {
    /**
     * A map ID is a unique identifier that represents Google Map styling and configuration settings that are stored in Google Cloud.
     * @see For more information, see https://developers.google.com/maps/documentation/android-sdk/map-ids/mapid-over
     */
    mapId?: string;
};
/**
 * @platform android
 */
export type GoogleMapsViewProps = {
    ref?: Ref<GoogleMapsViewType>;
    style?: StyleProp<ViewStyle>;
    /**
     * The initial camera position of the map.
     */
    cameraPosition?: CameraPosition;
    /**
     * The array of markers to display on the map.
     */
    markers?: GoogleMapsMarker[];
    /**
     * The array of polylines to display on the map.
     */
    polylines?: GoogleMapsPolyline[];
    /**
     * The array of polygons to display on the map.
     */
    polygons?: GoogleMapsPolygon[];
    /**
     * The array of circles to display on the map.
     */
    circles?: GoogleMapsCircle[];
    /**
     * The `MapUiSettings` to be used for UI-specific settings on the map.
     */
    uiSettings?: GoogleMapsUISettings;
    /**
     * The properties for the map.
     */
    properties?: GoogleMapsProperties;
    /**
     * Defines configuration GoogleMapOptions for a GoogleMap
     */
    mapOptions?: GoogleMapsMapOptions;
    /**
     * Defines the color scheme for the map.
     */
    colorScheme?: GoogleMapsColorScheme;
    /**
     * User location, overrides default behavior.
     */
    userLocation?: GoogleMapsUserLocation;
    /**
     * The padding values used to signal that portions of the map around the edges may be obscured.
     * The map will move the Google logo, etc. to avoid overlapping the padding.
     */
    contentPadding?: GoogleMapsContentPadding;
    /**
     * Lambda invoked when the map is loaded.
     */
    onMapLoaded?: () => void;
    /**
     * Lambda invoked when the user clicks on the map.
     * It won't be invoked if the user clicks on POI or a marker.
     */
    onMapClick?: (event: {
        coordinates: Coordinates;
    }) => void;
    /**
     * Lambda invoked when the user long presses on the map.
     */
    onMapLongClick?: (event: {
        coordinates: Coordinates;
    }) => void;
    /**
     * Lambda invoked when a POI is clicked.
     */
    onPOIClick?: (event: {
        name: string;
        coordinates: Coordinates;
    }) => void;
    /**
     * Lambda invoked when the marker is clicked
     */
    onMarkerClick?: (event: GoogleMapsMarker) => void;
    /**
     * Lambda invoked when the polyline is clicked.
     */
    onPolylineClick?: (event: GoogleMapsPolyline) => void;
    /**
     * Lambda invoked when the polygon is clicked.
     */
    onPolygonClick?: (event: GoogleMapsPolygon) => void;
    /**
     * Lambda invoked when the circle is clicked.
     */
    onCircleClick?: (event: GoogleMapsCircle) => void;
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
/**
 * @platform android
 */
export type SetCameraPositionConfig = CameraPosition & {
    /**
     * The duration of the animation in milliseconds.
     */
    duration?: number;
};
/**
 * @platform android
 */
export type GoogleMapsViewType = {
    /**
     * Update camera position.
     * @param config New camera position config.
     */
    setCameraPosition: (config?: SetCameraPositionConfig) => void;
};
/**
 * @platform android
 */
export type StreetViewCameraPosition = {
    coordinates: Coordinates;
    zoom?: number;
    tilt?: number;
    bearing?: number;
};
/**
 * @platform android
 */
export type GoogleStreetViewProps = {
    style?: StyleProp<ViewStyle>;
    position: StreetViewCameraPosition;
    isPanningGesturesEnabled?: boolean;
    isStreetNamesEnabled?: boolean;
    isUserNavigationEnabled?: boolean;
    isZoomGesturesEnabled?: boolean;
};
//# sourceMappingURL=GoogleMaps.types.d.ts.map