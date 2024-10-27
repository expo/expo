import CoreLocation
import ExpoModulesCore

struct LatLngRecord: Record {
  init() {}

  @Field var latitude: Double?
  @Field var longitude: Double?

  init(coordinate: CLLocationCoordinate2D) {
    latitude = coordinate.latitude
    longitude = coordinate.longitude
  }
}
