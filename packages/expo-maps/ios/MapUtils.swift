import SwiftUI
import MapKit

@available(iOS 17.0, *)
func convertToMapCamera(
  position: CameraPosition,
  size: CGSize,
  fitter: MapCameraFitter,
  currentCamera: MapCamera? = nil
) -> MapCameraPosition {
  let changesOrientation = position.tilt != nil || position.bearing != nil
  let fallbackCoordinate = changesOrientation ? currentCamera?.centerCoordinate : nil
  let requestedCoordinate = CLLocationCoordinate2D(
    latitude: position.coordinates?.latitude ?? fallbackCoordinate?.latitude ?? 0,
    longitude: position.coordinates?.longitude ?? fallbackCoordinate?.longitude ?? 0
  )
  guard let coordinate = mapCoordinate(requestedCoordinate),
    position.zoom?.isFinite != false,
    position.tilt?.isFinite != false,
    position.bearing?.isFinite != false else {
    return currentCamera.map { .camera($0) } ?? .automatic
  }
  guard changesOrientation else {
    return convertToMapCameraPosition(coordinate: coordinate, zoom: position.zoom ?? 1)
  }

  var centerCoordinate = coordinate
  let distance: CLLocationDistance
  if position.zoom == nil, let currentCamera {
    distance = currentCamera.distance
  } else {
    // Let MapKit fit the same region as the existing flat path at the actual view size.
    // Ground width is not camera distance; a hard-coded conversion changes zoom.
    let region = mapRegion(coordinate: coordinate, zoom: position.zoom ?? 1)
    guard let fittedCamera = fitter.camera(for: region, size: size) else {
      return currentCamera.map { .camera($0) } ?? .region(region)
    }
    centerCoordinate = fittedCamera.centerCoordinate
    distance = fittedCamera.distance
  }
  let bearing = position.bearing ?? currentCamera?.heading ?? 0
  return .camera(MapCamera(
    centerCoordinate: centerCoordinate,
    distance: distance,
    heading: (bearing.truncatingRemainder(dividingBy: 360) + 360).truncatingRemainder(dividingBy: 360),
    // Avoid the horizon singularity at 90 degrees, which can collapse distance on iOS.
    // MapKit applies its distance-dependent pitch limit below this bound.
    pitch: min(max(position.tilt ?? currentCamera?.pitch ?? 0, 0), 89)
  ))
}

// Retain one lazy fitting view per map; orientation-only updates reuse the live camera distance.
@available(iOS 17.0, *)
class MapCameraFitter {
  private lazy var mapView = MKMapView()

  func camera(for region: MKCoordinateRegion, size: CGSize) -> MapCamera? {
    guard size.width.isFinite, size.height.isFinite, size.width > 0, size.height > 0 else {
      return nil
    }
    mapView.frame = CGRect(origin: .zero, size: size)
    mapView.setRegion(region, animated: false)
    let camera = mapView.camera
    guard CLLocationCoordinate2DIsValid(camera.centerCoordinate),
      camera.centerCoordinateDistance.isFinite, camera.centerCoordinateDistance > 0 else {
      return nil
    }
    // A clipped region can also move the fitted center. Keep the fitted pose together.
    return MapCamera(
      centerCoordinate: camera.centerCoordinate,
      distance: camera.centerCoordinateDistance,
      heading: camera.heading,
      pitch: camera.pitch
    )
  }
}

// Ignore coordinates outside MapKit's projected world instead of fitting a
// clipped pole region, which can unexpectedly produce a world-scale camera.
private func mapCoordinate(_ coordinate: CLLocationCoordinate2D) -> CLLocationCoordinate2D? {
  let latitudeLimit = MKMapPoint(x: 0, y: 0).coordinate.latitude
  guard CLLocationCoordinate2DIsValid(coordinate), abs(coordinate.latitude) < latitudeLimit else {
    return nil
  }
  return coordinate
}

private func mapRegion(coordinate: CLLocationCoordinate2D, zoom: Double) -> MKCoordinateRegion {
  let delta = 360 / pow(2, zoom)
  return MKCoordinateRegion(
    center: coordinate,
    // World-scale requests must stay inside MapKit's valid geographic span.
    span: MKCoordinateSpan(latitudeDelta: min(delta, 180), longitudeDelta: min(delta, 360))
  )
}

@available(iOS 17.0, *)
func convertToMapCameraPosition(coordinate: CLLocationCoordinate2D, zoom: Double) -> MapCameraPosition {
  guard let coordinate = mapCoordinate(coordinate), zoom.isFinite else {
    return .automatic
  }
  return .region(mapRegion(coordinate: coordinate, zoom: zoom))
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
