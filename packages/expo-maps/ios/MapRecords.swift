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
  @Field var elevation: MapStyleElevation = MapStyleElevation.automatic
  @Field var emphasis: MapStyleEmphasis = MapStyleEmphasis.automatic
  @Field var pointsOfInterest: MapPointOfInterestCategories = MapPointOfInterestCategories()
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

enum MapStyleElevation: String, Enumerable {
  case automatic = "AUTOMATIC"
  case flat = "FLAT"
  case realistic = "REALISTIC"

  @available(iOS 17.0, *)
  func toMapStyleElevation() -> MapStyle.Elevation {
    switch self {
    case .flat:
      return .flat
    case .realistic:
      return .realistic
    default:
      return .automatic
    }
  }
}

enum MapStyleEmphasis: String, Enumerable {
  case muted = "MUTED"
  case automatic = "AUTOMATIC"

  @available(iOS 17.0, *)
  func toMapStyleEmphasis() -> MapStyle.StandardEmphasis {
    switch self {
    case .muted:
      return .muted
    default:
      return .automatic
    }
  }
}

enum MapType: String, Enumerable {
  case standard = "STANDARD"
  case hybrid = "HYBRID"
  case imagery = "IMAGERY"

  @available(iOS 17.0, *)
  func toMapStyle(_ properties: MapProperties) -> MapStyle {
    let mapType = properties.mapType
    let elevation = properties.elevation.toMapStyleElevation()
    let emphasis = properties.emphasis.toMapStyleEmphasis()
    let pointsOfInterest = properties.pointsOfInterest.toMapPointOfInterestCategories()
    let showsTraffic = properties.isTrafficEnabled

    switch mapType {
    case .hybrid:
      return .hybrid(
        elevation: elevation,
        pointsOfInterest: pointsOfInterest,
        showsTraffic: showsTraffic
      )
    case .imagery:
      return .imagery(
        elevation: elevation
      )
    default:
      return .standard(
        elevation: elevation,
        emphasis: emphasis,
        pointsOfInterest: pointsOfInterest,
        showsTraffic: showsTraffic
      )
    }
  }
}

struct MapPointOfInterestCategories: Record {
  @Field var including: [MapPointOfInterestCategory]?
  @Field var excluding: [MapPointOfInterestCategory]?

  @available(iOS 17.0, *)
  func toMapPointOfInterestCategories() -> PointOfInterestCategories {
    if let including = including {
      let poiCategories = including.compactMap { $0.toMapPointOfInterestCategory() }
      return .including(poiCategories)
    }

    if let excluding = excluding {
      let poiCategories = excluding.compactMap { $0.toMapPointOfInterestCategory() }
      return .excluding(poiCategories)
    }

    // show all POIs by default
    return .excluding([])
  }
}

enum MapPointOfInterestCategory: String, Enumerable {
  // Arts and culture
  case museum = "MUSEUM"
  case musicVenue = "MUSIC_VENUE"
  case theater = "THEATER"

  // Education
  case library = "LIBRARY"
  case planetarium = "PLANETARIUM"
  case school = "SCHOOL"
  case university = "UNIVERSITY"

  // Entertainment
  case movieTheater = "MOVIE_THEATER"
  case nightlife = "NIGHTLIFE"

  // Health and safety
  case fireStation = "FIRE_STATION"
  case hospital = "HOSPITAL"
  case pharmacy = "PHARMACY"
  case police = "POLICE"

  // Historical and cultural landmarks
  case castle = "CASTLE"
  case fortress = "FORTRESS"
  case landmark = "LANDMARK"
  case nationalMonument = "NATIONAL_MONUMENT"

  // Food and drink
  case bakery = "BAKERY"
  case brewery = "BREWERY"
  case cafe = "CAFE"
  case distillery = "DISTILLERY"
  case foodMarket = "FOOD_MARKET"
  case restaurant = "RESTAURANT"
  case winery = "WINERY"

  // Personal services
  case animalService = "ANIMAL_SERVICE"
  case atm = "ATM"
  case automotiveRepair = "AUTOMOTIVE_REPAIR"
  case bank = "BANK"
  case beauty = "BEAUTY"
  case evCharger = "EV_CHARGER"
  case fitnessCenter = "FITNESS_CENTER"
  case laundry = "LAUNDRY"
  case mailbox = "MAILBOX"
  case postOffice = "POST_OFFICE"
  case restroom = "RESTROOM"
  case spa = "SPA"
  case store = "STORE"

  // Parks and recreation
  case amusementPark = "AMUSEMENT_PARK"
  case aquarium = "AQUARIUM"
  case beach = "BEACH"
  case campground = "CAMPGROUND"
  case fairground = "FAIRGROUND"
  case marina = "MARINA"
  case nationalPark = "NATIONAL_PARK"
  case park = "PARK"
  case rvPark = "RV_PARK"
  case zoo = "ZOO"

  // Sports
  case baseball = "BASEBALL"
  case basketball = "BASKETBALL"
  case bowling = "BOWLING"
  case goKart = "GO_KART"
  case golf = "GOLF"
  case hiking = "HIKING"
  case miniGolf = "MINI_GOLF"
  case rockClimbing = "ROCK_CLIMBING"
  case skatePark = "SKATE_PARK"
  case skating = "SKATING"
  case skiing = "SKIING"
  case soccer = "SOCCER"
  case stadium = "STADIUM"
  case tennis = "TENNIS"
  case volleyball = "VOLLEYBALL"

  // Travel
  case airport = "AIRPORT"
  case carRental = "CAR_RENTAL"
  case conventionCenter = "CONVENTION_CENTER"
  case gasStation = "GAS_STATION"
  case hotel = "HOTEL"
  case parking = "PARKING"
  case publicTransport = "PUBLIC_TRANSPORT"

  // Water sports
  case fishing = "FISHING"
  case kayaking = "KAYAKING"
  case surfing = "SURFING"
  case swimming = "SWIMMING"

  @available(iOS 18.0, *)
  private static let ios18CategoryMap: [MapPointOfInterestCategory: MKPointOfInterestCategory] =
  [
    .musicVenue: .musicVenue,
    .planetarium: .planetarium,
    .castle: .castle,
    .fortress: .fortress,
    .landmark: .landmark,
    .nationalMonument: .nationalMonument,
    .distillery: .distillery,
    .animalService: .animalService,
    .automotiveRepair: .automotiveRepair,
    .beauty: .beauty,
    .baseball: .baseball,
    .basketball: .basketball,
    .bowling: .bowling,
    .goKart: .goKart,
    .golf: .golf,
    .hiking: .hiking,
    .miniGolf: .miniGolf,
    .rockClimbing: .rockClimbing,
    .skatePark: .skatePark,
    .skating: .skating,
    .skiing: .skiing,
    .fishing: .fishing,
    .kayaking: .kayaking,
    .surfing: .surfing,
    .swimming: .swimming,
    .mailbox: .mailbox,
    .spa: .spa,
    .fairground: .fairground,
    .rvPark: .rvPark,
    .tennis: .tennis,
    .volleyball: .volleyball,
    .soccer: .soccer,
    .conventionCenter: .conventionCenter
  ]

  private static let categoryMap: [MapPointOfInterestCategory: MKPointOfInterestCategory] =
  [
    .museum: .museum,
    .theater: .theater,
    .library: .library,
    .school: .school,
    .university: .university,
    .movieTheater: .movieTheater,
    .nightlife: .nightlife,
    .fireStation: .fireStation,
    .hospital: .hospital,
    .pharmacy: .pharmacy,
    .police: .police,
    .bakery: .bakery,
    .brewery: .brewery,
    .cafe: .cafe,
    .foodMarket: .foodMarket,
    .restaurant: .restaurant,
    .winery: .winery,
    .atm: .atm,
    .bank: .bank,
    .evCharger: .evCharger,
    .fitnessCenter: .fitnessCenter,
    .laundry: .laundry,
    .postOffice: .postOffice,
    .restroom: .restroom,
    .store: .store,
    .amusementPark: .amusementPark,
    .aquarium: .aquarium,
    .beach: .beach,
    .campground: .campground,
    .marina: .marina,
    .nationalPark: .nationalPark,
    .park: .park,
    .zoo: .zoo,
    .stadium: .stadium,
    .airport: .airport,
    .carRental: .carRental,
    .gasStation: .gasStation,
    .hotel: .hotel,
    .parking: .parking,
    .publicTransport: .publicTransport
  ]

  func toMapPointOfInterestCategory() -> MKPointOfInterestCategory? {
    if #available(iOS 18.0, *), let category = Self.ios18CategoryMap[self] {
      return category
    }
    return Self.categoryMap[self]
  }
}
