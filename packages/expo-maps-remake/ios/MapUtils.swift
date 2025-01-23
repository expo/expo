import SwiftUI
import MapKit

@available(iOS 17.0, *)
func convertToMapCamera(position: CameraPosition) -> MapCameraPosition {
  let coordinates = position.coordinates
  return MapCameraPosition.region(
    MKCoordinateRegion(
      center: CLLocationCoordinate2D(latitude: coordinates.latitude, longitude: coordinates.longitude),
      span: MKCoordinateSpan(latitudeDelta: position.zoom, longitudeDelta: position.zoom)
    )
  )
}
