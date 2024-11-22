import GooglePlaces
import GoogleMaps

class GooglePlacesFetchPlace {
  private var placesClient: GMSPlacesClient
  private var tokenUtils: GoogleMapsPlacesTokenUtils
  private var markers: GoogleMapsMarkers
  private var mapView: GMSMapView
  private var fetchedPlace: GMSPlace? {
    didSet {
      displayMarker()
    }
  }

  init(placesClient: GMSPlacesClient, tokenUtils: GoogleMapsPlacesTokenUtils, markers: GoogleMapsMarkers, mapView: GMSMapView) {
    self.placesClient = placesClient
    self.tokenUtils = tokenUtils
    self.markers = markers
    self.mapView = mapView
  }

  func search(placeId: String) {
    guard let token = tokenUtils.getToken() else {
      print("No token provided for auto complete request!")
      return
    }

    let fields = GMSPlaceField(rawValue: UInt64(GMSPlaceField.name.rawValue) | UInt64(GMSPlaceField.coordinate.rawValue))

    placesClient.fetchPlace(fromPlaceID: placeId, placeFields: fields, sessionToken: token, callback: { place, error in
      if let error = error {
        print("An error occurred: \(error.localizedDescription)")
      }
      if let place = place {
        self.fetchedPlace = place
      }
    })

    tokenUtils.setNewSessionToken()
  }
}

extension GooglePlacesFetchPlace {
  private func displayMarker() {
    if let marker = getMarkerToDisplay() {
      markers.setPOIMarkers(markerObjects: [marker])
      var bounds = GMSCoordinateBounds()
      let coordinate = CLLocationCoordinate2D(latitude: marker.latitude, longitude: marker.longitude)
      bounds = bounds.includingCoordinate(coordinate)
      let update = GMSCameraUpdate.fit(bounds)
      mapView.moveCamera(update)
    }
  }

  private func getMarkerToDisplay() -> MarkerObject? {
    guard let place = fetchedPlace else {
      return nil
    }

    let marker = MarkerObject()
    marker.latitude = place.coordinate.latitude
    marker.longitude = place.coordinate.longitude
    marker.markerTitle = place.name
    marker.opacity = 1
    marker.color = UIColor.clear
    marker.draggable = false
    return marker
  }
}
