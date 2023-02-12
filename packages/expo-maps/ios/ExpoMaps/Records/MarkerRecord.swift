import ExpoModulesCore
import GoogleMaps
import MapKit

struct MarkerRecord: Record {
  init() {}

  @Field var id: String?
  @Field var position: [String: Any?]

  init(id: String?, marker: GMSMarker) {
    self.id = id
    position = LatLngRecord(coordinate: marker.position).toDictionary()
  }

  init(marker: ExpoMKAnnotation) {
    id = marker.id
    position = LatLngRecord(coordinate: marker.coordinate).toDictionary()
  }

  init(marker: ExpoMKClusterAnnotation) {
    id = marker.id
    position = LatLngRecord(coordinate: marker.coordinate).toDictionary()
  }

  init(id: String, position: CLLocationCoordinate2D) {
    self.id = id
    self.position = LatLngRecord(coordinate: position).toDictionary()
  }
}
