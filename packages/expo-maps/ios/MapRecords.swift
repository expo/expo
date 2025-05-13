// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import MapKit
import SwiftUI

struct Coordinate: Record {
  @Field var latitude: Double = 0
  @Field var longitude: Double = 0
}

struct MapMarker: Identifiable, Record {
  @Field var id: String = UUID().uuidString
  @Field var coordinates: Coordinate
  @Field var systemImage: String = ""
  @Field var tintColor: Color = .red
  @Field var title: String = ""

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

struct CameraPosition: Record, Equatable {
  @Field var coordinates: Coordinate
  @Field var zoom: Double = 1

  static func == (lhs: CameraPosition, rhs: CameraPosition) -> Bool {
    return lhs.coordinates.latitude == rhs.coordinates.latitude
      && lhs.coordinates.longitude == rhs.coordinates.longitude && lhs.zoom == rhs.zoom
  }
}

struct MapAnnotation: Record, Identifiable {
  @Field var id: String = UUID().uuidString
  @Field var coordinates: Coordinate
  @Field var title: String = ""
  @Field var backgroundColor: Color = .white
  @Field var textColor: Color = .black
  @Field var text: String = ""
  @Field var icon: SharedRef<UIImage>?

  var clLocationCoordinate2D: CLLocationCoordinate2D {
    CLLocationCoordinate2D(
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    )
  }
}

struct ExpoAppleMapPolyline: Record, Identifiable {
  @Field var id: String = UUID().uuidString

  @Field var coordinates: [Coordinate]
  @Field var color: Color = .blue
  @Field var width: Double = 4
  @Field var contourStyle: String = "straight"

  var clLocationCoordinates2D: [CLLocationCoordinate2D] {
    return coordinates.map {
      CLLocationCoordinate2D(latitude: $0.latitude, longitude: $0.longitude)
    }
  }

  var mkPlacemark: MKPlacemark {
    MKPlacemark(
      coordinate: clLocationCoordinates2D.first ?? CLLocationCoordinate2D(latitude: 0, longitude: 0)
    )
  }

  var mapItem: MKMapItem {
    MKMapItem(placemark: mkPlacemark)
  }
}

struct Circle: Record, Identifiable {
  @Field var id: String = UUID().uuidString

  @Field var center: Coordinate
  @Field var radius: Double
  @Field var lineColor: Color?
  @Field var lineWidth: Double?
  @Field var color: Color = .green

  var clLocationCoordinate2D: CLLocationCoordinate2D {
    CLLocationCoordinate2D(
      latitude: center.latitude,
      longitude: center.longitude
    )
  }

  var mkPlacemark: MKPlacemark {
    MKPlacemark(coordinate: clLocationCoordinate2D)
  }

  var mapItem: MKMapItem {
    MKMapItem(placemark: mkPlacemark)
  }
}

struct Polygon: Record, Identifiable {
  @Field var id: String = UUID().uuidString

  @Field var coordinates: [Coordinate]
  @Field var color: Color = .blue
  @Field var lineColor: Color?
  @Field var lineWidth: Double?

  var clLocationCoordinates2D: [CLLocationCoordinate2D] {
    return coordinates.map {
      CLLocationCoordinate2D(latitude: $0.latitude, longitude: $0.longitude)
    }
  }

  var mkPlacemark: MKPlacemark {
    MKPlacemark(
      coordinate: clLocationCoordinates2D.first ?? CLLocationCoordinate2D(latitude: 0, longitude: 0)
    )
  }

  var mapItem: MKMapItem {
    MKMapItem(placemark: mkPlacemark)
  }
}

struct MapUISettings: Record {
  @Field var compassEnabled: Bool = true
  @Field var myLocationButtonEnabled: Bool = true
  @Field var scaleBarEnabled: Bool = false
  @Field var togglePitchEnabled: Bool = true
}

struct MapProperties: Record {
  @Field var isMyLocationEnabled: Bool = false
  @Field var mapType: MapType = .standard
  @Field var isTrafficEnabled: Bool = false
  @Field var selectionEnabled: Bool = true
  @Field var polylineTapThreshold: Double = 20
}

enum MapContourStyle: String, Enumerable {
  case straight = "STRAIGHT"
  case geodesic = "GEODESIC"

  @available(iOS 17.0, *)
  func toContourStyle() -> MapPolyline.ContourStyle {
    switch self {
    case .straight:
      return .straight
    case .geodesic:
      return .geodesic
    }
  }
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
