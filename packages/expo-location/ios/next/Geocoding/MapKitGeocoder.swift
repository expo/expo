import ExpoModulesCore
import MapKit

@available(iOS 26.0, *)
final class MapKitGeocoder: GeocoderNext {
  var forwardMapItems: (_ address: String, _ locale: Locale?) async throws -> [MKMapItem] = { address, locale in
    guard let request = MKGeocodingRequest(addressString: address) else {
      return []
    }
    request.preferredLocale = locale
    return try await request.mapItems
  }

  var reverseMapItems: (_ location: CLLocation, _ locale: Locale?) async throws -> [MKMapItem] = { location, locale in
    guard let request = MKReverseGeocodingRequest(location: location) else {
      return []
    }
    request.preferredLocale = locale
    return try await request.mapItems
  }

  func geocode(_ address: String, options: GeocodeOptions) async throws -> [Address] {
    do {
      return try await forwardMapItems(address, options.locale.map(Locale.init(identifier:))).map { $0.toAddress() }
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
      return try await reverseMapItems(location, options.locale.map(Locale.init(identifier:))).map { $0.toAddress() }
    } catch {
      return try handleGeocodingError(error)
    }
  }

  private func handleGeocodingError(_ error: Error) throws -> [Address] {
    switch error {
    case MKError.placemarkNotFound:
      return []
    case MKError.loadingThrottled, MKError.serverFailure:
      throw GeocodingUnavailableException().causedBy(error)
    default:
      throw GeocodingFailedException().causedBy(error)
    }
  }
}

@available(iOS 26.0, *)
private extension MKMapItem {
  func toAddress() -> Address {
    Address(
      coordinates: Coordinates(latitude: location.coordinate.latitude, longitude: location.coordinate.longitude),
      name: normalizeAddressString(name),
      formattedAddress: normalizeAddressString(
        addressRepresentations?.fullAddress(includingRegion: true, singleLine: true)
      ),
      city: normalizeAddressString(addressRepresentations?.cityName),
      country: normalizeAddressString(addressRepresentations?.regionName),
      isoCountryCode: normalizeAddressString(addressRepresentations?.region?.identifier)
    )
  }
}
