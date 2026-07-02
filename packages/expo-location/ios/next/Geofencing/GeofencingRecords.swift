// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import CoreLocation
import ExpoModulesCore

internal struct Coordinate: Record {
  @Field var latitude: Double = 0
  @Field var longitude: Double = 0
  
  var location: CLLocation {
    .init(latitude: latitude, longitude: longitude)
  }
}

internal struct GeofencingRegion: Record {
  @Field
  var id: String = UUID().uuidString.lowercased()
  
  @Field
  var coordinates: Coordinate = Coordinate()
  
  @Field
  var radius: Double = 50
  
  
  var clLocationCoordinate2D: CLLocationCoordinate2D {
    CLLocationCoordinate2D(
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    )
  }
  
  var legacyDict: [String: Any] {
    [
      "identifier": id,
      "latitude": coordinates.latitude,
      "longitude": coordinates.longitude,
      "radius": radius
    ]
  }
}


internal struct GeofencingEvent: Record {
  @Field
  var region: GeofencingRegion = GeofencingRegion()
  
  @Field
  var state: GeofencingRegionState = .unknown
}

enum GeofencingRegionState: String, Enumerable {
  case unknown = "UNKNOWN"
  case inside = "INSIDE"
  case outside = "OUTSIDE"

  @available(iOS 17.0, *)
  init(from: CLMonitor.Event.State) {
    switch from {
    case .satisfied: self = .inside
    case .unsatisfied: self = .outside
    default: self = .unknown
    }
  }
}
