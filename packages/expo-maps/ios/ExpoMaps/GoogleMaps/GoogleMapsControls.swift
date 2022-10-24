import GoogleMaps

class GoogleMapsControls: Controls {
  private let mapView: GMSMapView

  init(mapView: GMSMapView) {
    self.mapView = mapView
  }

  func setShowCompass(enable: Bool) {
    mapView.settings.compassButton = enable
  }

  func setShowMyLocationButton(enable: Bool) {
    if enable == true {
      mapView.isMyLocationEnabled = true
    }
    mapView.settings.myLocationButton = enable
  }

  func setShowLevelPicker(enable: Bool) {
    // appears whenever an indoor map is featured prominently
    mapView.settings.indoorPicker = enable
  }
 }
