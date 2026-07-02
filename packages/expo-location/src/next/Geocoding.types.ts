export type GeocodingResult = {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  /*
   * Note: on iOS 26+ this field may be 0 if the accuracy is not available
   */
  accuracy?: number;
  /*
   * Note: on iOS 26+ this field may be 0 if the altitude is not available
   */
  altitude?: number;
};

export type ReverseGeocodingResult = {
  city?: string;
  country?: string;
  district?: string;
  formattedAddress?: string;
  isoCountryCode?: string;
  name?: string;
  postalCode?: string;
  region?: string;
  street?: string;
  streetNumber?: string;
  subregion?: string;
  timezone?: string;
};

export type GeocodingModule = {
  geocodeAsync(address: string): Promise<GeocodingResult[]>;
  reverseGeocodeAsync(coordinates: {
    latitude: number;
    longitude: number;
  }): Promise<ReverseGeocodingResult[]>;
};
