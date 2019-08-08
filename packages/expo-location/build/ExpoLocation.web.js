import { EventEmitter } from '@unimodules/core';
class GeocoderError extends Error {
    constructor() {
        super('Geocoder service is not available for this device.');
        this.code = 'E_NO_GEOCODER';
    }
}
const emitter = new EventEmitter({});
function positionToJSON(position) {
    if (!position)
        return null;
    const { coords = {}, timestamp } = position;
    return {
        coords: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            altitude: coords.altitude,
            accuracy: coords.accuracy,
            altitudeAccuracy: coords.altitudeAccuracy,
            heading: coords.heading,
            speed: coords.speed,
        },
        timestamp,
    };
}
export default {
    get name() {
        return 'ExpoLocation';
    },
    async getProviderStatusAsync() {
        return {
            locationServicesEnabled: 'geolocation' in navigator,
        };
    },
    async getCurrentPositionAsync(options) {
        return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(position => resolve(positionToJSON(position)), reject, options));
    },
    async removeWatchAsync(watchId) {
        navigator.geolocation.clearWatch(watchId);
    },
    async watchDeviceHeading(headingId) {
        console.warn('Location.watchDeviceHeading: is not supported on web');
    },
    async hasServicesEnabledAsync() {
        return 'geolocation' in navigator;
    },
    async geocodeAsync() {
        throw new GeocoderError();
    },
    async reverseGeocodeAsync() {
        throw new GeocoderError();
    },
    async watchPositionImplAsync(watchId, options) {
        return new Promise(resolve => {
            // @ts-ignore
            watchId = global.navigator.geolocation.watchPosition(location => {
                emitter.emit('Expo.locationChanged', { watchId, location: positionToJSON(location) });
            }, null, options);
            resolve(watchId);
        });
    },
    async requestPermissionsAsync() {
        return new Promise(resolve => {
            navigator.geolocation.getCurrentPosition(() => resolve({ status: 'granted' }), ({ code }) => {
                if (code === 1 /* PERMISSION_DENIED */) {
                    resolve({ status: 'denied' });
                }
                else {
                    resolve({ status: 'undetermined' });
                }
            });
        });
    },
};
//# sourceMappingURL=ExpoLocation.web.js.map