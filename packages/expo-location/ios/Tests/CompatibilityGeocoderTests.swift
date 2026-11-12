import Contacts
import CoreLocation
import MapKit
import Testing

@testable import ExpoLocation

@Suite("CompatibilityGeocoder")
struct CompatibilityGeocoderTests {
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
  func `rejects invalid coordinates before requesting placemarks`(latitude: Double, longitude: Double) async {
    let geocoder = CompatibilityGeocoder()
    geocoder.reversePlacemarks = { _, _ in
      Issue.record("placemarks must not be requested for invalid coordinates")
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
    let geocoder = CompatibilityGeocoder()
    var requestedPlacemarks = false
    geocoder.reversePlacemarks = { location, _ in
      requestedPlacemarks = true
      #expect(location.coordinate.latitude == latitude)
      #expect(location.coordinate.longitude == longitude)
      return []
    }

    let addresses = try await geocoder.reverseGeocode(
      Coordinates(latitude: latitude, longitude: longitude), options: ReverseGeocodeOptions()
    )

    #expect(requestedPlacemarks)
    #expect(addresses.isEmpty)
  }

  @Test
  func `maps a placemark to an address`() async throws {
    let geocoder = CompatibilityGeocoder()
    geocoder.forwardPlacemarks = { _, _ in [applePark] }

    let addresses = try await geocoder.geocode("1 Infinite Loop", options: GeocodeOptions())

    #expect(addresses.count == 1)
    #expect(addresses[0].coordinates.latitude == 37.3318)
    #expect(addresses[0].coordinates.longitude == -122.0312)
    #expect(addresses[0].formattedAddress == "1 Infinite Loop, Cupertino CA 95014, United States")
    #expect(addresses[0].city == "Cupertino")
    #expect(addresses[0].country == "United States")
    #expect(addresses[0].isoCountryCode == "US")
  }

  @Test
  func `reverse geocodes coordinates into an address`() async throws {
    let geocoder = CompatibilityGeocoder()
    geocoder.reversePlacemarks = { location, locale in
      #expect(location.coordinate.latitude == 37.332)
      #expect(location.coordinate.longitude == -122.032)
      #expect(locale == Locale(identifier: "en-US"))
      return [applePark]
    }

    let addresses = try await geocoder.reverseGeocode(
      Coordinates(latitude: 37.332, longitude: -122.032),
      options: ReverseGeocodeOptions(locale: "en-US")
    )

    #expect(addresses.count == 1)
    let address = try #require(addresses.first)
    #expect(address.coordinates.latitude == 37.3318)
    #expect(address.coordinates.longitude == -122.0312)
    #expect(address.formattedAddress == "1 Infinite Loop, Cupertino CA 95014, United States")
    #expect(address.city == "Cupertino")
    #expect(address.country == "United States")
    #expect(address.isoCountryCode == "US")
  }

  @Test
  func `normalizes blank placemark fields`() async throws {
    let postalAddress = CNMutablePostalAddress()
    postalAddress.city = " \t\n"
    postalAddress.country = " \t\n"
    postalAddress.isoCountryCode = " \t\n"
    let placemark = MKPlacemark(
      coordinate: CLLocationCoordinate2D(latitude: 37.3318, longitude: -122.0312),
      postalAddress: postalAddress
    )
    let geocoder = CompatibilityGeocoder()
    geocoder.forwardPlacemarks = { _, _ in [placemark] }

    let addresses = try await geocoder.geocode("somewhere", options: GeocodeOptions())

    let address = try #require(addresses.first)
    #expect(address.city == nil)
    #expect(address.country == nil)
    #expect(address.isoCountryCode == nil)
  }

  @Test(arguments: [CLError(.geocodeFoundNoResult), CLError(.geocodeFoundPartialResult)])
  func `returns no addresses when the seam reports no result`(error: CLError) async throws {
    let geocoder = CompatibilityGeocoder()
    geocoder.forwardPlacemarks = { _, _ in throw error }

    let addresses = try await geocoder.geocode("nowhere", options: GeocodeOptions())

    #expect(addresses.isEmpty)
  }

  @Test(arguments: forwardedErrors)
  func `forwards a seam error as the matching exception`(error: any Error, exception: Any.Type) async {
    let geocoder = CompatibilityGeocoder()
    geocoder.forwardPlacemarks = { _, _ in throw error }

    await #expect {
      try await geocoder.geocode("1 Infinite Loop", options: GeocodeOptions())
    } throws: { thrown in
      type(of: thrown) == exception
    }
  }
}

private struct SomeError: Error {}

private let forwardedErrors: [(any Error, Any.Type)] = [
  (CLError(.network), GeocodingUnavailableException.self),
  (CLError(.denied), GeocodingFailedException.self),
  (CLError(.geocodeCanceled), GeocodingFailedException.self),
  (SomeError(), GeocodingFailedException.self),
]

private let applePark: CLPlacemark = {
  let postalAddress = CNMutablePostalAddress()
  postalAddress.street = "1 Infinite Loop"
  postalAddress.city = "Cupertino"
  postalAddress.state = "CA"
  postalAddress.postalCode = "95014"
  postalAddress.country = "United States"
  postalAddress.isoCountryCode = "US"
  return MKPlacemark(
    coordinate: CLLocationCoordinate2D(latitude: 37.3318, longitude: -122.0312),
    postalAddress: postalAddress
  )
}()
