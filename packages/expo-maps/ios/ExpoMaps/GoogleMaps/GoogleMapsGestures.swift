import GoogleMaps

class GoogleMapsGestures: Gestures {
  private let mapView: GMSMapView

  init(mapView: GMSMapView) {
    self.mapView = mapView
  }

  func setEnabledRotateGesture(enabled: Bool) {
    mapView.settings.rotateGestures = enabled
  }

  func setEnabledScrollGesture(enabled: Bool) {
    mapView.settings.scrollGestures = enabled
  }

  func setEnabledTiltGesture(enabled: Bool) {
    mapView.settings.tiltGestures = enabled
  }

  func setEnabledZoomGesture(enabled: Bool) {
    mapView.settings.zoomGestures = enabled
  }
}
