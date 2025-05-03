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

@available(iOS 17.0, *)
extension View {
  func renderPolygon(_ polygon: Polygon) -> some MapContent {
    let mapPolygon = MapPolygon(coordinates: polygon.clLocationCoordinates2D)
    return
      mapPolygon
      .stroke(polygon.lineColor ?? .clear, lineWidth: polygon.lineWidth ?? 0)
      .foregroundStyle(polygon.color)
  }
}
