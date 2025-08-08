import type { SharedRefType } from 'expo';
import type { Ref } from 'react';
import type { ProcessedColorValue, StyleProp, ViewStyle } from 'react-native';
import { CameraPosition, Coordinates } from '../shared.types';
/**
 * @platform ios
 */
export type AppleMapsMarker = {
    /**
     * The unique identifier for the marker. This can be used to identify the clicked marker in the `onMarkerClick` event.
     */
    id?: string;
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
 * The style of the polyline.
 * @platform ios
 */
export declare enum AppleMapsContourStyle {
    /**
     * A straight line.
     */
    STRAIGHT = "STRAIGHT",
    /**
     * A geodesic line.
     */
    GEODESIC = "GEODESIC"
}
/**
 * @platform ios
 */
export declare enum AppleMapsMapStyleElevation {
    /**
     * The default elevation style, that renders a flat, 2D map.
     */
    AUTOMATIC = "AUTOMATIC",
    /**
     * A flat elevation style.
     */
    FLAT = "FLAT",
    /**
     * A value that renders a realistic, 3D map.
     */
    REALISTIC = "REALISTIC"
}
/**
 * @platform ios
 */
export declare enum AppleMapsMapStyleEmphasis {
    /**
     * The default level of emphasis.
     */
    AUTOMATIC = "AUTOMATIC",
    /**
     * A muted emphasis style, that deemphasizes the map’s imagery.
     */
    MUTED = "MUTED"
}
/**
 * @platform ios
 * @see https://developer.apple.com/documentation/mapkit/AppleMapPointOfInterestCategory
 */
export declare enum AppleMapPointOfInterestCategory {
    MUSEUM = "MUSEUM",
    MUSIC_VENUE = "MUSIC_VENUE",
    THEATER = "THEATER",
    LIBRARY = "LIBRARY",
    PLANETARIUM = "PLANETARIUM",
    SCHOOL = "SCHOOL",
    UNIVERSITY = "UNIVERSITY",
    MOVIE_THEATER = "MOVIE_THEATER",
    NIGHTLIFE = "NIGHTLIFE",
    FIRE_STATION = "FIRE_STATION",
    HOSPITAL = "HOSPITAL",
    PHARMACY = "PHARMACY",
    POLICE = "POLICE",
    CASTLE = "CASTLE",
    FORTRESS = "FORTRESS",
    LANDMARK = "LANDMARK",
    NATIONAL_MONUMENT = "NATIONAL_MONUMENT",
    BAKERY = "BAKERY",
    BREWERY = "BREWERY",
    CAFE = "CAFE",
    DISTILLERY = "DISTILLERY",
    FOOD_MARKET = "FOOD_MARKET",
    RESTAURANT = "RESTAURANT",
    WINERY = "WINERY",
    ANIMAL_SERVICE = "ANIMAL_SERVICE",
    ATM = "ATM",
    AUTOMOTIVE_REPAIR = "AUTOMOTIVE_REPAIR",
    BANK = "BANK",
    BEAUTY = "BEAUTY",
    EV_CHARGER = "EV_CHARGER",
    FITNESS_CENTER = "FITNESS_CENTER",
    LAUNDRY = "LAUNDRY",
    MAILBOX = "MAILBOX",
    POST_OFFICE = "POST_OFFICE",
    RESTROOM = "RESTROOM",
    SPA = "SPA",
    STORE = "STORE",
    AMUSEMENT_PARK = "AMUSEMENT_PARK",
    AQUARIUM = "AQUARIUM",
    BEACH = "BEACH",
    CAMPGROUND = "CAMPGROUND",
    FAIRGROUND = "FAIRGROUND",
    MARINA = "MARINA",
    NATIONAL_PARK = "NATIONAL_PARK",
    PARK = "PARK",
    RV_PARK = "RV_PARK",
    ZOO = "ZOO",
    BASEBALL = "BASEBALL",
    BASKETBALL = "BASKETBALL",
    BOWLING = "BOWLING",
    GO_KART = "GO_KART",
    GOLF = "GOLF",
    HIKING = "HIKING",
    MINI_GOLF = "MINI_GOLF",
    ROCK_CLIMBING = "ROCK_CLIMBING",
    SKATE_PARK = "SKATE_PARK",
    SKATING = "SKATING",
    SKIING = "SKIING",
    SOCCER = "SOCCER",
    STADIUM = "STADIUM",
    TENNIS = "TENNIS",
    VOLLEYBALL = "VOLLEYBALL",
    AIRPORT = "AIRPORT",
    CAR_RENTAL = "CAR_RENTAL",
    CONVENTION_CENTER = "CONVENTION_CENTER",
    GAS_STATION = "GAS_STATION",
    HOTEL = "HOTEL",
    PARKING = "PARKING",
    PUBLIC_TRANSPORT = "PUBLIC_TRANSPORT",
    FISHING = "FISHING",
    KAYAKING = "KAYAKING",
    SURFING = "SURFING",
    SWIMMING = "SWIMMING"
}
/**
 * @platform ios
 */
export type AppleMapsPointOfInterestCategories = {
    /**
     * The POI categories to include.
     * To hide all POIs, set this to an empty array.
     */
    including?: AppleMapPointOfInterestCategory[];
    /**
     * The POI categories to exclude.
     * To show all POIs, set this to an empty array.
     */
    excluding?: AppleMapPointOfInterestCategory[];
};
/**
 * @platform ios
 */
export type AppleMapsProperties = {
    /**
     * Whether the user location is shown on the map.
     * @default false
     */
    isMyLocationEnabled?: boolean;
    /**
     * Whether the traffic layer is enabled on the map.
     */
    isTrafficEnabled?: boolean;
    /**
     * Defines which map type should be used.
     */
    mapType?: AppleMapsMapType;
    /**
     * A structure you use to define points of interest to include or exclude on a map.
     */
    pointsOfInterest?: AppleMapsPointOfInterestCategories;
    /**
     * Values you use to determine whether a map renders elevation.
     */
    elevation?: AppleMapsMapStyleElevation;
    /**
     * Values that control how the framework emphasizes map features.
     */
    emphasis?: AppleMapsMapStyleEmphasis;
    /**
     * If true, the user can select a location on the map to get more information.
     */
    selectionEnabled?: boolean;
    /**
     * The maximum distance in meters from a tap of a polyline for it to be considered a hit.
     * If the distance is greater than the threshold, the polyline is not considered a hit.
     * If a hit occurs, the `onPolylineClick` event will be triggered.
     * Defaults to 20 meters.
     */
    polylineTapThreshold?: number;
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
export type AppleMapsPolyline = {
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
     * The style of the polyline.
     */
    contourStyle?: AppleMapsContourStyle;
};
/**
 * @platform ios
 */
export type AppleMapsCircle = {
    /**
     * The unique identifier for the circle. This can be used to identify the clicked circle in the `onCircleClick` event.
     */
    id?: string;
    /**
     * The coordinates of the circle.
     */
    center: Coordinates;
    /**
     * The radius of the circle (in meters).
     */
    radius: number;
    /**
     * The color of the circle.
     */
    color?: ProcessedColorValue | string;
    /**
     * The width of the circle.
     */
    width?: number;
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
 * @platform ios
 */
export type AppleMapsPolygon = {
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
 * @platform ios
 */
export type AppleMapsViewProps = {
    ref?: Ref<AppleMapsViewType>;
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
     * The array of polylines to display on the map.
     */
    polylines?: AppleMapsPolyline[];
    /**
     * The array of polygons to display on the map.
     */
    polygons?: AppleMapsPolygon[];
    /**
     * The array of circles to display on the map.
     */
    circles?: AppleMapsCircle[];
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
     * @platform ios 18.0+
     */
    onMarkerClick?: (event: AppleMapsMarker) => void;
    /**
     * Lambda invoked when the polyline is clicked
     * @platform ios 18.0+
     */
    onPolylineClick?: (event: AppleMapsPolyline) => void;
    /**
     * Lambda invoked when the polygon is clicked
     * @platform ios 18.0+
     */
    onPolygonClick?: (event: AppleMapsPolygon) => void;
    /**
     * Lambda invoked when the circle is clicked
     * @platform ios 18.0+
     */
    onCircleClick?: (event: AppleMapsCircle) => void;
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
 * @platform ios
 */
export type AppleMapsViewType = {
    /**
     * Update camera position.
     * Animation duration is not supported on iOS.
     *
     * @param config New camera postion.
     */
    setCameraPosition: (config?: CameraPosition) => void;
    /**
     * Opens the look around view at specified coordinates.
     *
     * @param coordinates The coordinates of the location to open the look around view at.
     */
    openLookAroundAsync: (coordinates: Coordinates) => Promise<void>;
};
//# sourceMappingURL=AppleMaps.types.d.ts.map