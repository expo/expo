import GoogleMaps

class GoogleMapsMarkers: Markers {
  private let mapView: GMSMapView
  private let googleMapsMarkersManager: GoogleMapsMarkersManager
  private var poiMarkers: [GMSMarker] = []

  init(mapView: GMSMapView, googleMapsMarkersManager: GoogleMapsMarkersManager) {
    self.mapView = mapView
    self.googleMapsMarkersManager = googleMapsMarkersManager
  }

  func setMarkers(markerObjects: [MarkerObject]) {
    detachAndDeleteMarkers()
    for markerObject in markerObjects {
      let marker: GMSMarker = createGoogleMarker(markerObject: markerObject, includeDragging: true)

      marker.map = mapView
      googleMapsMarkersManager.appendMarker(marker: marker, id: markerObject.id)
    }
  }

  func setPOIMarkers(markerObjects: [MarkerObject]) {
    detachAndDeletePOIMarkers()
    for markerObject in markerObjects {
      let marker: GMSMarker = createGoogleMarker(markerObject: markerObject, includeDragging: false)

      marker.map = mapView
      poiMarkers.append(marker)
    }
  }

  internal func detachAndDeleteMarkers() {
    googleMapsMarkersManager.clearMarkers()
  }

  func detachAndDeletePOIMarkers() {
    for marker in poiMarkers {
      marker.map = nil
    }
    poiMarkers = []
  }
}
