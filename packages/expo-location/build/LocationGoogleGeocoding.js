// @needsAudit
/**
 * @deprecated The Geocoding API has been removed from SDK 49.
 *
 * @see please use [Place Autocomplete](https://developers.google.com/maps/documentation/places/web-service/autocomplete) intead.
 * @param apiKey Ignored
 */
export function setGoogleApiKey(_apiKey) { }
export async function googleGeocodeAsync(_address) {
    if (__DEV__) {
        console.warn('The Geocoding API has been removed in SDK 49, use Place Autocomplete service instead' +
            '(https://developers.google.com/maps/documentation/places/web-service/autocomplete)');
    }
    return [];
}
export async function googleReverseGeocodeAsync(_options) {
    if (__DEV__) {
        console.warn('The Geocoding API has been removed in SDK 49, use Place Autocomplete service instead' +
            '(https://developers.google.com/maps/documentation/places/web-service/autocomplete)');
    }
    return [];
}
//# sourceMappingURL=LocationGoogleGeocoding.js.map