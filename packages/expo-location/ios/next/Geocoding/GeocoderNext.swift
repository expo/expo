protocol GeocoderNext {
  func geocode(_ address: String, options: GeocodeOptions) async throws -> [Address]
  func reverseGeocode(_ coordinates: Coordinates, options: ReverseGeocodeOptions) async throws -> [Address]
}
