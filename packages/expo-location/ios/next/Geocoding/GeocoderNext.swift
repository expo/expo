// Copyright 2025-present 650 Industries. All rights reserved.

import MapKit
import CoreLocation


protocol GeocoderType {
  static func geocode(address: String) async throws -> [GeocodingResult]
  static func reverseGeocode(coordinate: Coordinate) async throws -> [ReverseGeocodingResult]
}

@available(iOS 26.0, *)
internal struct MKGeocoder: GeocoderType {
  static func geocode(address: String) async throws -> [GeocodingResult] {
    guard let request = MKGeocodingRequest(addressString: address) else {
      return []
    }
    do {
      return try await request.mapItems.map { item in
        let location = item.location
        return GeocodingResult(accuracy: location.horizontalAccuracy, altitude: location.altitude, coordinates: Coordinate(latitude: location.coordinate.latitude, longitude: location.coordinate.longitude))
      }
    } catch {
      return []
    }
  }
  
  static func reverseGeocode(coordinate: Coordinate) async throws -> [ReverseGeocodingResult] {
    guard let request = MKReverseGeocodingRequest(location: coordinate.location) else {
      return []
    }
    
    return try await request.mapItems.map { item in
      let placemark = item.placemark
      
      return ReverseGeocodingResult(
        city: placemark.locality,
        country: placemark.country,
        district: placemark.subLocality,
        formattedAddress: nil,
        isoCountryCode: placemark.countryCode,
        name: placemark.name,
        postalCode: placemark.postalCode,
        region: placemark.region?.identifier, //FIXME
        street: placemark.thoroughfare,
        streetNumber: placemark.subThoroughfare,
        subregion: placemark.subAdministrativeArea,
        timezone: placemark.timeZone?.identifier
      )
    }
  }
}
internal struct EXCLGeocoder: GeocoderType {
  static func reverseGeocode(coordinate: Coordinate) async throws -> [ReverseGeocodingResult] {
    return []
  }
  
  static func geocode(address: String) async throws -> [GeocodingResult] {
    return []
  }
}
