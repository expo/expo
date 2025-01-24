import SwiftUI
import MapKit

@available(iOS 17.0, *)
func convertToMapCamera(position: CameraPosition) -> MapCameraPosition {
  let coordinates = position.coordinates

  let longitudeDelta = 360 / pow(2, position.zoom)
  let latitudeDelta = longitudeDelta / cos(0 * .pi / 180)

  return MapCameraPosition.region(
    MKCoordinateRegion(
      center: CLLocationCoordinate2D(latitude: coordinates.latitude, longitude: coordinates.longitude),
      span: MKCoordinateSpan(latitudeDelta: latitudeDelta, longitudeDelta: longitudeDelta)
    )
  )
}
