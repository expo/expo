import GoogleMaps

class GoogleMapsCircles: Circles {
  private let mapView: GMSMapView
  private var circles: [GMSCircle] = []

  init(mapView: GMSMapView) {
    self.mapView = mapView
  }

  func setCircles(circleObjects: [CircleObject]) {
    detachAndDeleteCircles()
    for circleObject in circleObjects {
      let circle = GMSCircle(
        position: CLLocationCoordinate2D(
          latitude: circleObject.center.latitude, longitude: circleObject.center.longitude),
        radius: circleObject.radius)
      circle.fillColor = circleObject.fillColor ?? circle.fillColor
      circle.strokeWidth = CGFloat(circleObject.strokeWidth ?? Float(circle.strokeWidth))
      circle.strokeColor = circleObject.strokeColor ?? circle.strokeColor
      circle.map = mapView
      circles.append(circle)
    }
  }

  internal func detachAndDeleteCircles() {
    for circle in circles {
      circle.map = nil
    }
    circles = []
  }
}
