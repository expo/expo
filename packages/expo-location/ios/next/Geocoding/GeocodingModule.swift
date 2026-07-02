// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import MapKit

public final class GeocodingModule: Module {
  private lazy var geocoder: GeocoderType.Type = {
    if #available(iOS 26.0, *) {
      return MKGeocoder.self
    } else {
      return EXCLGeocoder.self
    }
  }()
  
  public func definition() -> ModuleDefinition {
    Name("ExpoLocationGeocoding")
    
    AsyncFunction("geocodeAsync") { (address: String) async throws in
      try await geocoder.geocode(address: address)
    }
    
    AsyncFunction("reverseGeocodeAsync") { (coordinate: Coordinate) async throws in
      try await geocoder.reverseGeocode(coordinate: coordinate)
    }
  }
}
