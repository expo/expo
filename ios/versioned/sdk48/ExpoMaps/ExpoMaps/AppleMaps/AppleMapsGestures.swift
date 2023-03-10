import MapKit

final class AppleMapsGestures: Gestures {
  private let mapView: MKMapView

  init(mapView: MKMapView) {
    self.mapView = mapView
  }

  init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  func setEnabledRotateGesture(enabled: Bool) {
    mapView.isRotateEnabled = enabled
  }

  func setEnabledScrollGesture(enabled: Bool) {
    mapView.isScrollEnabled = enabled
  }

  func setEnabledTiltGesture(enabled: Bool) {
    mapView.isPitchEnabled = enabled
  }

  func setEnabledZoomGesture(enabled: Bool) {
    mapView.isZoomEnabled = enabled
  }
}
