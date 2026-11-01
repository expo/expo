import Contacts
import CoreLocation
import ExpoModulesCore

final class CompatibilityGeocoder: GeocoderNext {
  var forwardPlacemarks: (_ address: String, _ locale: Locale?) async throws -> [CLPlacemark] = { address, locale in
    try await CLGeocoder().geocodeAddressString(address, in: nil, preferredLocale: locale)
  }

  var reversePlacemarks: (_ location: CLLocation, _ locale: Locale?) async throws -> [CLPlacemark] = { location, locale in
    try await CLGeocoder().reverseGeocodeLocation(location, preferredLocale: locale)
  }

  func geocode(_ address: String, options: GeocodeOptions) async throws -> [Address] {
    do {
      let placemarks = try await forwardPlacemarks(address, options.locale.map(Locale.init(identifier:)))
      return placemarks.compactMap { $0.toAddress() }
    } catch {
      return try handleGeocodingError(error)
    }
  }

  func reverseGeocode(_ coordinates: Coordinates, options: ReverseGeocodeOptions) async throws -> [Address] {
    guard CLLocationCoordinate2DIsValid(
      CLLocationCoordinate2D(latitude: coordinates.latitude, longitude: coordinates.longitude)
    ) else {
      throw InvalidCoordinatesException()
    }
    let location = CLLocation(latitude: coordinates.latitude, longitude: coordinates.longitude)
    do {
      let placemarks = try await reversePlacemarks(location, options.locale.map(Locale.init(identifier:)))
      return placemarks.compactMap { $0.toAddress() }
    } catch {
      return try handleGeocodingError(error)
    }
  }

  private func handleGeocodingError(_ error: Error) throws -> [Address] {
    switch error {
    case CLError.geocodeFoundNoResult, CLError.geocodeFoundPartialResult:
      return []
    case CLError.network:
      throw GeocodingUnavailableException().causedBy(error)
    default:
      throw GeocodingFailedException().causedBy(error)
    }
  }
}

private extension CLPlacemark {
  func toAddress() -> Address? {
    guard let location else {
      return nil
    }
    return Address(
      coordinates: Coordinates(latitude: location.coordinate.latitude, longitude: location.coordinate.longitude),
      name: normalizeAddressString(name),
      formattedAddress: normalizeAddressString(postalAddress.map(formatOnOneLine)),
      city: normalizeAddressString(locality),
      country: normalizeAddressString(country),
      isoCountryCode: normalizeAddressString(isoCountryCode)
    )
  }
}

// Single line, comma-separated, like `MKAddress.fullAddress(includingRegion:singleLine:)` on iOS 26
// "1 Infinite Loop\nCupertino CA 95014\nUnited States" -> "1 Infinite Loop, Cupertino CA 95014, United States"
private func formatOnOneLine(_ postalAddress: CNPostalAddress) -> String {
  return CNPostalAddressFormatter.string(from: postalAddress, style: .mailingAddress)
    .components(separatedBy: .newlines)
    .filter { !$0.isEmpty }
    .joined(separator: ", ")
}
