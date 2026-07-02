import ExpoLocationGeofencing from './ExpoLocationGeofencing';
export async function startTaskAsync(name, regions = []) {
    return ExpoLocationGeofencing.startTaskAsync(name, { regions });
}
export async function stopTaskAsync(name) {
    return ExpoLocationGeofencing.stopTaskAsync(name);
}
export async function hasTaskStartedAsync(name) {
    return ExpoLocationGeofencing.hasTaskStartedAsync(name);
}
export function addCallback(region, callback) {
    return ExpoLocationGeofencing.addCallback(region, callback);
}
export function removeCallback(id) {
    return ExpoLocationGeofencing.removeCallback(id);
}
//# sourceMappingURL=Geofencing%20copy.js.map