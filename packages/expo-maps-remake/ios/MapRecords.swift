// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI
import MapKit

struct Coordinate: Record {
  @Field var latitude: Double = 0
  @Field var longitude: Double = 0
}

struct MapMarker: Identifiable, Record {
  @Field var id: String = UUID().uuidString
  @Field var coordinates: Coordinate
  @Field var title: String = ""
  @Field var icon: SharedRef<UIImage>?

  var clLocationCoordinate2D: CLLocationCoordinate2D {
    CLLocationCoordinate2D(
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    )
  }

  var mkPlacemark: MKPlacemark {
    MKPlacemark(coordinate: clLocationCoordinate2D)
  }

  var mapItem: MKMapItem {
    MKMapItem(placemark: mkPlacemark)
  }
}

struct CameraPosition: Record {
  @Field var coordinates: Coordinate
  @Field var zoom: Double = 1
}

struct MapAnnotation: Record, Identifiable {
  @Field var id: String = UUID().uuidString
  @Field var coordinates: Coordinate
  @Field var title: String = ""
  @Field var backgroundColor: Color = .white
  @Field var textColor: Color = .black
  @Field var text: String = ""
}

struct MapUISettings: Record {
  @Field var compassEnabled: Bool = true
  @Field var myLocationButtonEnabled: Bool = true
  @Field var scaleBarEnabled: Bool = false
  @Field var togglePitchEnabled: Bool = true
}

struct MapProperties: Record {
  @Field var mapType: MapType = .standard
  @Field var isTrafficEnabled: Bool = false
  @Field var selectionEnabled: Bool = true
}

enum MapType: String, Enumerable {
  case standard = "STANDARD"
  case hybrid = "HYBRID"
  case imagery = "IMAGERY"

  @available(iOS 17.0, *)
  func toMapStyle(showsTraffic: Bool = false) -> MapStyle {
    switch self {
    case .standard:
      return .standard(pointsOfInterest: .all, showsTraffic: showsTraffic)
    case .hybrid:
      return .hybrid(pointsOfInterest: .all, showsTraffic: showsTraffic)
    case .imagery:
      return .imagery
    }
  }
}
