import { LocationGeocodedAddress, LocationGeocodedLocation } from './Location.types';
/**
 * @deprecated The Geocoding API has been removed from SDK 49.
 *
 * @see please use [Place Autocomplete](https://developers.google.com/maps/documentation/places/web-service/autocomplete) intead.
 * @param apiKey Ignored
 */
export declare function setGoogleApiKey(_apiKey: string): void;
export declare function googleGeocodeAsync(_address: string): Promise<LocationGeocodedLocation[]>;
export declare function googleReverseGeocodeAsync(_options: {
    latitude: number;
    longitude: number;
}): Promise<LocationGeocodedAddress[]>;
//# sourceMappingURL=LocationGoogleGeocoding.d.ts.map