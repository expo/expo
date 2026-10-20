import CoreLocation
import MapKit
import Testing

@testable import ExpoLocation

@Suite("MapKitGeocoder")
struct MapKitGeocoderTests {
  @Test(arguments: [
    (200, 0),
    (90.000001, 0),
    (-90.000001, 0),
    (0, 180.000001),
    (0, -180.000001),
    (.nan, 0),
    (0, .nan),
    (.infinity, 0),
    (-.infinity, 0),
    (0, .infinity),
    (0, -.infinity),
  ] as [(Double, Double)])
  func `rejects invalid coordinates before requesting map items`(latitude: Double, longitude: Double) async {
    guard #available(iOS 26.0, *) else {
      return
    }
    let geocoder = MapKitGeocoder()
    geocoder.reverseMapItems = { _, _ in
      Issue.record("map items must not be requested for invalid coordinates")
      return []
    }

    await #expect(throws: InvalidCoordinatesException.self) {
      try await geocoder.reverseGeocode(
        Coordinates(latitude: latitude, longitude: longitude), options: ReverseGeocodeOptions()
      )
    }
  }

  @Test(arguments: [
    (0, 0),
    (-90, -180),
    (-90, 180),
    (90, -180),
    (90, 180),
  ] as [(Double, Double)])
  func `accepts valid coordinate boundaries`(latitude: Double, longitude: Double) async throws {
    guard #available(iOS 26.0, *) else {
      return
    }
    let geocoder = MapKitGeocoder()
    var requestedMapItems = false
    geocoder.reverseMapItems = { location, _ in
      requestedMapItems = true
      #expect(location.coordinate.latitude == latitude)
      #expect(location.coordinate.longitude == longitude)
      return []
    }

    let addresses = try await geocoder.reverseGeocode(
      Coordinates(latitude: latitude, longitude: longitude), options: ReverseGeocodeOptions()
    )

    #expect(requestedMapItems)
    #expect(addresses.isEmpty)
  }

  // A constructed MKMapItem has no addressRepresentations, so location and address can be tested
  @Test
  func `maps a map item to an address`() async throws {
    guard #available(iOS 26.0, *) else {
      return
    }
    let mapItem = MKMapItem(
      location: CLLocation(latitude: 37.3318, longitude: -122.0312),
      address: MKAddress(fullAddress: "1 Infinite Loop, Cupertino CA 95014, United States", shortAddress: nil)
    )
    mapItem.name = "Apple Park"
    let geocoder = MapKitGeocoder()
    geocoder.forwardMapItems = { _, _ in [mapItem] }

    let addresses = try await geocoder.geocode("1 Infinite Loop", options: GeocodeOptions())

    #expect(addresses.count == 1)
    #expect(addresses[0].coordinates.latitude == 37.3318)
    #expect(addresses[0].coordinates.longitude == -122.0312)
    #expect(addresses[0].name == "Apple Park")
  }

  @Test
  func `reverse geocodes coordinates into an address`() async throws {
    guard #available(iOS 26.0, *) else {
      return
    }
    let mapItem = MKMapItem(location: CLLocation(latitude: 37.3318, longitude: -122.0312), address: nil)
    mapItem.name = "Apple Park"
    let geocoder = MapKitGeocoder()
    geocoder.reverseMapItems = { location, locale in
      #expect(location.coordinate.latitude == 37.332)
      #expect(location.coordinate.longitude == -122.032)
      #expect(locale == Locale(identifier: "en-US"))
      return [mapItem]
    }

    let addresses = try await geocoder.reverseGeocode(
      Coordinates(latitude: 37.332, longitude: -122.032),
      options: ReverseGeocodeOptions(locale: "en-US")
    )

    #expect(addresses.count == 1)
    let address = try #require(addresses.first)
    #expect(address.coordinates.latitude == 37.3318)
    #expect(address.coordinates.longitude == -122.0312)
    #expect(address.name == "Apple Park")
  }

  @Test
  func `normalizes a blank map item name`() async throws {
    guard #available(iOS 26.0, *) else {
      return
    }
    let mapItem = MKMapItem(location: CLLocation(latitude: 37.3318, longitude: -122.0312), address: nil)
    mapItem.name = " \t\n"
    let geocoder = MapKitGeocoder()
    geocoder.reverseMapItems = { _, _ in [mapItem] }

    let addresses = try await geocoder.reverseGeocode(
      Coordinates(latitude: 37.3318, longitude: -122.0312), options: ReverseGeocodeOptions()
    )

    let address = try #require(addresses.first)
    #expect(address.name == nil)
  }

  @Test
  func `returns no addresses when the seam reports no result`() async throws {
    guard #available(iOS 26.0, *) else {
      return
    }
    let geocoder = MapKitGeocoder()
    geocoder.forwardMapItems = { _, _ in throw MKError(.placemarkNotFound) }

    let addresses = try await geocoder.geocode("nowhere", options: GeocodeOptions())

    #expect(addresses.isEmpty)
  }

  @Test(arguments: forwardedErrors)
  func `forwards a seam error as the matching exception`(error: any Error, exception: Any.Type) async {
    guard #available(iOS 26.0, *) else {
      return
    }
    let geocoder = MapKitGeocoder()
    geocoder.forwardMapItems = { _, _ in throw error }

    await #expect {
      try await geocoder.geocode("1 Infinite Loop", options: GeocodeOptions())
    } throws: { thrown in
      type(of: thrown) == exception
    }
  }
}

private struct SomeError: Error {}

private let forwardedErrors: [(any Error, Any.Type)] = [
  (MKError(.loadingThrottled), GeocodingUnavailableException.self),
  (MKError(.serverFailure), GeocodingUnavailableException.self),
  (MKError(.unknown), GeocodingFailedException.self),
  (MKError(.decodingFailed), GeocodingFailedException.self),
  (SomeError(), GeocodingFailedException.self),
]
