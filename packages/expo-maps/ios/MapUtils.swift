import SwiftUI
import MapKit

@available(iOS 17.0, *)
func convertToMapCamera(position: CameraPosition) -> MapCameraPosition {
  let coordinate = CLLocationCoordinate2D(
    latitude: position.coordinates.latitude,
    longitude: position.coordinates.longitude
  )
  return convertToMapCameraPosition(coordinate: coordinate, zoom: position.zoom)
}

@available(iOS 17.0, *)
func convertToMapCameraPosition(coordinate: CLLocationCoordinate2D, zoom: Double) -> MapCameraPosition {
  let longitudeDelta = 360 / pow(2, zoom)
  let latitudeDelta = longitudeDelta / cos(0 * .pi / 180)

  return MapCameraPosition.region(
    MKCoordinateRegion(
      center: coordinate,
      span: MKCoordinateSpan(latitudeDelta: latitudeDelta, longitudeDelta: longitudeDelta)
    )
  )
}

@available(iOS 17.0, *)
func getLookAroundScene(from coordinate: CLLocationCoordinate2D) async throws -> MKLookAroundScene? {
  do {
    return try await MKLookAroundSceneRequest(coordinate: coordinate).scene
  } catch {
    throw SceneUnavailableAtLocationException()
  }
}

@available(iOS 17.0, *)
extension View {
  func renderCircle(_ circle: Circle) -> some MapContent {
    let mapCircle = MapCircle(center: circle.clLocationCoordinate2D, radius: circle.radius)
    return mapCircle
      .stroke(circle.lineColor ?? .clear, lineWidth: circle.lineWidth ?? 0)
      .foregroundStyle(circle.color)
  }

  func renderPolygon(_ polygon: Polygon) -> some MapContent {
    let mapPolygon = MapPolygon(coordinates: polygon.clLocationCoordinates2D)
    return mapPolygon
      .stroke(polygon.lineColor ?? .clear, lineWidth: polygon.lineWidth ?? 0)
      .foregroundStyle(polygon.color)
  }
}
