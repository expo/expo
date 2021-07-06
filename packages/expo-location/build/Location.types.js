/**
 * Enum with available location accuracies.
 */
export var LocationAccuracy;
(function (LocationAccuracy) {
    LocationAccuracy[LocationAccuracy["Lowest"] = 1] = "Lowest";
    LocationAccuracy[LocationAccuracy["Low"] = 2] = "Low";
    LocationAccuracy[LocationAccuracy["Balanced"] = 3] = "Balanced";
    LocationAccuracy[LocationAccuracy["High"] = 4] = "High";
    LocationAccuracy[LocationAccuracy["Highest"] = 5] = "Highest";
    LocationAccuracy[LocationAccuracy["BestForNavigation"] = 6] = "BestForNavigation";
})(LocationAccuracy || (LocationAccuracy = {}));
/**
 * Enum with available activity types of background location tracking.
 */
export var LocationActivityType;
(function (LocationActivityType) {
    LocationActivityType[LocationActivityType["Other"] = 1] = "Other";
    LocationActivityType[LocationActivityType["AutomotiveNavigation"] = 2] = "AutomotiveNavigation";
    LocationActivityType[LocationActivityType["Fitness"] = 3] = "Fitness";
    LocationActivityType[LocationActivityType["OtherNavigation"] = 4] = "OtherNavigation";
    LocationActivityType[LocationActivityType["Airborne"] = 5] = "Airborne";
})(LocationActivityType || (LocationActivityType = {}));
/**
 * A type of the event that geofencing task can receive.
 */
export var LocationGeofencingEventType;
(function (LocationGeofencingEventType) {
    LocationGeofencingEventType[LocationGeofencingEventType["Enter"] = 1] = "Enter";
    LocationGeofencingEventType[LocationGeofencingEventType["Exit"] = 2] = "Exit";
})(LocationGeofencingEventType || (LocationGeofencingEventType = {}));
/**
 * State of the geofencing region that you receive through the geofencing task.
 */
export var LocationGeofencingRegionState;
(function (LocationGeofencingRegionState) {
    LocationGeofencingRegionState[LocationGeofencingRegionState["Unknown"] = 0] = "Unknown";
    LocationGeofencingRegionState[LocationGeofencingRegionState["Inside"] = 1] = "Inside";
    LocationGeofencingRegionState[LocationGeofencingRegionState["Outside"] = 2] = "Outside";
})(LocationGeofencingRegionState || (LocationGeofencingRegionState = {}));
//# sourceMappingURL=Location.types.js.map