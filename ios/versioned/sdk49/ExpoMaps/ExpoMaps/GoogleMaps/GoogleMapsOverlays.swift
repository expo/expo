import GoogleMaps

class GoogleMapsOverlays: Overlays {
  private let mapView: GMSMapView
  private var overlays: [GMSGroundOverlay] = []

  init(mapView: GMSMapView) {
    self.mapView = mapView
  }

  func setOverlays(overlayObjects: [OverlayObject]) {
    detachAndDeleteOverlays()
    for overlayObject in overlayObjects {
      let southWest = CLLocationCoordinate2D(latitude: overlayObject.bounds.southWest.latitude, longitude: overlayObject.bounds.southWest.longitude)
      let northEast = CLLocationCoordinate2D(latitude: overlayObject.bounds.northEast.latitude, longitude: overlayObject.bounds.northEast.longitude)
      let overlayBounds = GMSCoordinateBounds(coordinate: southWest, coordinate: northEast)
      let iconURL = URL(fileURLWithPath: overlayObject.icon)
      let icon = UIImage(contentsOfFile: iconURL.standardized.path)
      let overlay = GMSGroundOverlay(bounds: overlayBounds, icon: icon)
      overlay.bearing = 0
      overlay.map = mapView
      overlays.append(overlay)
    }
  }

  internal func detachAndDeleteOverlays() {
    for overlay in overlays {
      overlay.map = nil
    }
    overlays = []
  }
}
