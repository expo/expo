import MapKit

class AppleMapsCircles: Circles {
  private let mapView: MKMapView
  private var circles: [MKCircle] = []

  init(mapView: MKMapView) {
    self.mapView = mapView
  }

  func setCircles(circleObjects: [CircleObject]) {
    detachAndDeleteCircles()
    for circleObject in circleObjects {
      let circle = ExpoMKCircle(
        center: CLLocationCoordinate2D(
          latitude: circleObject.center.latitude, longitude: circleObject.center.longitude),
        radius: circleObject.radius
      )
      if circleObject.fillColor != nil { circle.fillColor = circleObject.fillColor! }
      if circleObject.strokeColor != nil { circle.strokeColor = circleObject.strokeColor! }
      if circleObject.strokeWidth != nil { circle.strokeWidth = circleObject.strokeWidth! }
      mapView.addOverlay(circle)
      circles.append(circle)
    }
  }

  internal func detachAndDeleteCircles() {
    for circle in circles {
      self.mapView.removeOverlay(circle)
    }
    circles = []
  }
}
