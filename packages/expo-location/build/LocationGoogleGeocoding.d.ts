import { LocationGeocodedAddress, LocationGeocodedLocation } from './Location.types';
export declare function setGoogleApiKey(apiKey: string): void;
export declare function googleGeocodeAsync(address: string): Promise<LocationGeocodedLocation[]>;
export declare function googleReverseGeocodeAsync(options: {
    latitude: number;
    longitude: number;
}): Promise<LocationGeocodedAddress[]>;
