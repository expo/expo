/**
 * The type of map to display.
 * @platform ios
 */
export var AppleMapsMapType;
(function (AppleMapsMapType) {
    /**
     * A satellite image of the area with road and road name layers on top.
     */
    AppleMapsMapType["HYBRID"] = "HYBRID";
    /**
     * A street map that shows the position of all roads and some road names.
     */
    AppleMapsMapType["STANDARD"] = "STANDARD";
    /**
     * A satellite image of the area.
     */
    AppleMapsMapType["IMAGERY"] = "IMAGERY";
})(AppleMapsMapType || (AppleMapsMapType = {}));
/**
 * The style of the polyline.
 * @platform ios
 */
export var AppleMapsContourStyle;
(function (AppleMapsContourStyle) {
    /**
     * A straight line.
     */
    AppleMapsContourStyle["STRAIGHT"] = "STRAIGHT";
    /**
     * A geodesic line.
     */
    AppleMapsContourStyle["GEODESIC"] = "GEODESIC";
})(AppleMapsContourStyle || (AppleMapsContourStyle = {}));
/**
 * @platform ios
 */
export var AppleMapsMapStyleElevation;
(function (AppleMapsMapStyleElevation) {
    /**
     * The default elevation style, that renders a flat, 2D map.
     */
    AppleMapsMapStyleElevation["AUTOMATIC"] = "AUTOMATIC";
    /**
     * A flat elevation style.
     */
    AppleMapsMapStyleElevation["FLAT"] = "FLAT";
    /**
     * A value that renders a realistic, 3D map.
     */
    AppleMapsMapStyleElevation["REALISTIC"] = "REALISTIC";
})(AppleMapsMapStyleElevation || (AppleMapsMapStyleElevation = {}));
/**
 * @platform ios
 */
export var AppleMapsMapStyleEmphasis;
(function (AppleMapsMapStyleEmphasis) {
    /**
     * The default level of emphasis.
     */
    AppleMapsMapStyleEmphasis["AUTOMATIC"] = "AUTOMATIC";
    /**
     * A muted emphasis style, that deemphasizes the map’s imagery.
     */
    AppleMapsMapStyleEmphasis["MUTED"] = "MUTED";
})(AppleMapsMapStyleEmphasis || (AppleMapsMapStyleEmphasis = {}));
/**
 * @platform ios
 * @see https://developer.apple.com/documentation/mapkit/AppleMapPointOfInterestCategory
 */
export var AppleMapPointOfInterestCategory;
(function (AppleMapPointOfInterestCategory) {
    // Arts and culture
    AppleMapPointOfInterestCategory["MUSEUM"] = "MUSEUM";
    AppleMapPointOfInterestCategory["MUSIC_VENUE"] = "MUSIC_VENUE";
    AppleMapPointOfInterestCategory["THEATER"] = "THEATER";
    // Education
    AppleMapPointOfInterestCategory["LIBRARY"] = "LIBRARY";
    AppleMapPointOfInterestCategory["PLANETARIUM"] = "PLANETARIUM";
    AppleMapPointOfInterestCategory["SCHOOL"] = "SCHOOL";
    AppleMapPointOfInterestCategory["UNIVERSITY"] = "UNIVERSITY";
    // Entertainment
    AppleMapPointOfInterestCategory["MOVIE_THEATER"] = "MOVIE_THEATER";
    AppleMapPointOfInterestCategory["NIGHTLIFE"] = "NIGHTLIFE";
    // Health and safety
    AppleMapPointOfInterestCategory["FIRE_STATION"] = "FIRE_STATION";
    AppleMapPointOfInterestCategory["HOSPITAL"] = "HOSPITAL";
    AppleMapPointOfInterestCategory["PHARMACY"] = "PHARMACY";
    AppleMapPointOfInterestCategory["POLICE"] = "POLICE";
    // Historical and cultural landmarks
    AppleMapPointOfInterestCategory["CASTLE"] = "CASTLE";
    AppleMapPointOfInterestCategory["FORTRESS"] = "FORTRESS";
    AppleMapPointOfInterestCategory["LANDMARK"] = "LANDMARK";
    AppleMapPointOfInterestCategory["NATIONAL_MONUMENT"] = "NATIONAL_MONUMENT";
    // Food and drink
    AppleMapPointOfInterestCategory["BAKERY"] = "BAKERY";
    AppleMapPointOfInterestCategory["BREWERY"] = "BREWERY";
    AppleMapPointOfInterestCategory["CAFE"] = "CAFE";
    AppleMapPointOfInterestCategory["DISTILLERY"] = "DISTILLERY";
    AppleMapPointOfInterestCategory["FOOD_MARKET"] = "FOOD_MARKET";
    AppleMapPointOfInterestCategory["RESTAURANT"] = "RESTAURANT";
    AppleMapPointOfInterestCategory["WINERY"] = "WINERY";
    // Personal services
    AppleMapPointOfInterestCategory["ANIMAL_SERVICE"] = "ANIMAL_SERVICE";
    AppleMapPointOfInterestCategory["ATM"] = "ATM";
    AppleMapPointOfInterestCategory["AUTOMOTIVE_REPAIR"] = "AUTOMOTIVE_REPAIR";
    AppleMapPointOfInterestCategory["BANK"] = "BANK";
    AppleMapPointOfInterestCategory["BEAUTY"] = "BEAUTY";
    AppleMapPointOfInterestCategory["EV_CHARGER"] = "EV_CHARGER";
    AppleMapPointOfInterestCategory["FITNESS_CENTER"] = "FITNESS_CENTER";
    AppleMapPointOfInterestCategory["LAUNDRY"] = "LAUNDRY";
    AppleMapPointOfInterestCategory["MAILBOX"] = "MAILBOX";
    AppleMapPointOfInterestCategory["POST_OFFICE"] = "POST_OFFICE";
    AppleMapPointOfInterestCategory["RESTROOM"] = "RESTROOM";
    AppleMapPointOfInterestCategory["SPA"] = "SPA";
    AppleMapPointOfInterestCategory["STORE"] = "STORE";
    // Parks and recreation
    AppleMapPointOfInterestCategory["AMUSEMENT_PARK"] = "AMUSEMENT_PARK";
    AppleMapPointOfInterestCategory["AQUARIUM"] = "AQUARIUM";
    AppleMapPointOfInterestCategory["BEACH"] = "BEACH";
    AppleMapPointOfInterestCategory["CAMPGROUND"] = "CAMPGROUND";
    AppleMapPointOfInterestCategory["FAIRGROUND"] = "FAIRGROUND";
    AppleMapPointOfInterestCategory["MARINA"] = "MARINA";
    AppleMapPointOfInterestCategory["NATIONAL_PARK"] = "NATIONAL_PARK";
    AppleMapPointOfInterestCategory["PARK"] = "PARK";
    AppleMapPointOfInterestCategory["RV_PARK"] = "RV_PARK";
    AppleMapPointOfInterestCategory["ZOO"] = "ZOO";
    // Sports
    AppleMapPointOfInterestCategory["BASEBALL"] = "BASEBALL";
    AppleMapPointOfInterestCategory["BASKETBALL"] = "BASKETBALL";
    AppleMapPointOfInterestCategory["BOWLING"] = "BOWLING";
    AppleMapPointOfInterestCategory["GO_KART"] = "GO_KART";
    AppleMapPointOfInterestCategory["GOLF"] = "GOLF";
    AppleMapPointOfInterestCategory["HIKING"] = "HIKING";
    AppleMapPointOfInterestCategory["MINI_GOLF"] = "MINI_GOLF";
    AppleMapPointOfInterestCategory["ROCK_CLIMBING"] = "ROCK_CLIMBING";
    AppleMapPointOfInterestCategory["SKATE_PARK"] = "SKATE_PARK";
    AppleMapPointOfInterestCategory["SKATING"] = "SKATING";
    AppleMapPointOfInterestCategory["SKIING"] = "SKIING";
    AppleMapPointOfInterestCategory["SOCCER"] = "SOCCER";
    AppleMapPointOfInterestCategory["STADIUM"] = "STADIUM";
    AppleMapPointOfInterestCategory["TENNIS"] = "TENNIS";
    AppleMapPointOfInterestCategory["VOLLEYBALL"] = "VOLLEYBALL";
    // Travel
    AppleMapPointOfInterestCategory["AIRPORT"] = "AIRPORT";
    AppleMapPointOfInterestCategory["CAR_RENTAL"] = "CAR_RENTAL";
    AppleMapPointOfInterestCategory["CONVENTION_CENTER"] = "CONVENTION_CENTER";
    AppleMapPointOfInterestCategory["GAS_STATION"] = "GAS_STATION";
    AppleMapPointOfInterestCategory["HOTEL"] = "HOTEL";
    AppleMapPointOfInterestCategory["PARKING"] = "PARKING";
    AppleMapPointOfInterestCategory["PUBLIC_TRANSPORT"] = "PUBLIC_TRANSPORT";
    // Water sports
    AppleMapPointOfInterestCategory["FISHING"] = "FISHING";
    AppleMapPointOfInterestCategory["KAYAKING"] = "KAYAKING";
    AppleMapPointOfInterestCategory["SURFING"] = "SURFING";
    AppleMapPointOfInterestCategory["SWIMMING"] = "SWIMMING";
})(AppleMapPointOfInterestCategory || (AppleMapPointOfInterestCategory = {}));
//# sourceMappingURL=AppleMaps.types.js.map