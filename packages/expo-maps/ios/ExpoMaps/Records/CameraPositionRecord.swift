import ExpoModulesCore
import GoogleMaps
import MapKit

struct CameraPositionRecord: Record {
  init() {}

  @Field var target: [String: Any?]
  @Field var zoom: Float?
  @Field var bearing: Double?
  @Field var tilt: Double?
  @Field var latitudeDelta: Double?
  @Field var longitudeDelta: Double?

  init(cameraPosition: GMSCameraPosition, visibleRegion: GMSVisibleRegion?) {
    target = LatLngRecord(coordinate: cameraPosition.target).toDictionary()
    zoom = cameraPosition.zoom
    bearing = cameraPosition.bearing
    tilt = cameraPosition.viewingAngle
    if let visibleRegion = visibleRegion {
      latitudeDelta = abs(visibleRegion.nearLeft.latitude - visibleRegion.farRight.latitude)
      longitudeDelta = abs(visibleRegion.nearLeft.longitude - visibleRegion.farRight.longitude)
    }
  }

  init(camera: MKMapCamera, coordinateSpan: MKCoordinateSpan) {
    target = LatLngRecord(coordinate: camera.centerCoordinate).toDictionary()
    bearing = camera.heading
    tilt = camera.pitch
    latitudeDelta = coordinateSpan.latitudeDelta
    longitudeDelta = coordinateSpan.longitudeDelta
  }
}
