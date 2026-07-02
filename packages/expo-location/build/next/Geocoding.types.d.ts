export type GeocodingResult = {
    coordinates: {
        latitude: number;
        longitude: number;
    };
    accuracy?: number;
    altitude?: number;
};
export type GeocodingModule = {
    geocodeAsync(address: string): Promise<GeocodingResult[]>;
    reverseGeocodeAsync(coordinates: {
        latitude: number;
        longitude: number;
    }): Promise<GeocodingResult[]>;
};
//# sourceMappingURL=Geocoding.types.d.ts.map