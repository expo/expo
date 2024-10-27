import CoreLocation
import ExpoModulesCore

struct PointOfInterestRecord: Record {
  init() {}

  @Field var position: [String: Any?]?
  @Field var name: String?
  @Field var placeId: String?

  init(placeId: String, name: String, location: CLLocationCoordinate2D) {
    position = LatLngRecord(coordinate: location).toDictionary()
    self.placeId = placeId
    self.name = name
  }
}
