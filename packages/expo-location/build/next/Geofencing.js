import ExpoLocationGeofencing from './ExpoLocationGeofencing';
export async function startTaskAsync(name, regions = []) {
    return ExpoLocationGeofencing.startTaskAsync(name, regions);
}
export async function stopTaskAsync(name) {
    return ExpoLocationGeofencing.stopTaskAsync(name);
}
export async function hasTaskStartedAsync(name) {
    return ExpoLocationGeofencing.hasTaskStartedAsync(name);
}
export async function addCallbackAsync(region, callback) {
    return ExpoLocationGeofencing.addCallbackAsync(region, callback);
}
export async function removeCallbackAsync(id) {
    return ExpoLocationGeofencing.removeCallbackAsync(id);
}
//# sourceMappingURL=Geofencing.js.map