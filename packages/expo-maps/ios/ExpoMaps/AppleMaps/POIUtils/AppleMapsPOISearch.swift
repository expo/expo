import MapKit

class AppleMapsPOISearch {
  private var mapView: MKMapView
  private var markers: AppleMapsMarkers

  private var pointOfInterestCategories: [MKPointOfInterestCategory]?
  private var searchResultRegion: MKCoordinateRegion?
  private var places: [MKMapItem]? {
    didSet {
      displayMarkers()
    }
  }
  private var localSearch: MKLocalSearch? {
    willSet {
      places = nil
      localSearch?.cancel()
    }
  }

  init(mapView: MKMapView, markers: AppleMapsMarkers) {
    self.mapView = mapView
    self.markers = markers
  }

  func setPointsOfInterestCategories(categories: [MKPointOfInterestCategory]?) {
    pointOfInterestCategories = categories
  }

  private func search() {
    localSearch?.start { [weak self] response, error in
      guard let strongSelf = self else {
        return
      }

      guard error == nil else {
          print("MKLocalSearch search start resulted in an error")
          return
      }

      strongSelf.searchResultRegion = response?.boundingRegion
      strongSelf.places = response?.mapItems
    }
  }
}

// MKLocalSearch.Request
extension AppleMapsPOISearch {
  func createSearchRequest(for suggestedCompletion: MKLocalSearchCompletion) {
    let searchRequest = MKLocalSearch.Request(completion: suggestedCompletion)
    setSearchFilter(request: searchRequest)
    seatSearchRegion(request: searchRequest)
    search(using: searchRequest)
  }

  func createSearchRequest(for queryString: String?) {
    let searchRequest = MKLocalSearch.Request()
    searchRequest.naturalLanguageQuery = queryString
    setSearchFilter(request: searchRequest)
    seatSearchRegion(request: searchRequest)
    search(using: searchRequest)
  }

  private func setSearchFilter(request: MKLocalSearch.Request) {
    var filter: MKPointOfInterestFilter
    if let categories = pointOfInterestCategories, !categories.isEmpty {
      filter = MKPointOfInterestFilter.init(including: categories)
    } else {
      filter = MKPointOfInterestFilter.includingAll
    }
    request.pointOfInterestFilter = filter
  }

  private func seatSearchRegion(request: MKLocalSearch.Request) {
    request.region = mapView.region
  }

  private func search(using searchRequest: MKLocalSearch.Request) {
    localSearch = MKLocalSearch(request: searchRequest)
    search()
  }
}

// displaying search results
extension AppleMapsPOISearch {
  private func displayMarkers() {
    let pointsOfInterestToDisplay = getMarkersToDisplay()
    setMarkersDisplayRegion()
    markers.setPOIMarkers(markerObjects: pointsOfInterestToDisplay)
  }

  private func getMarkersToDisplay() -> [MarkerObject] {
    guard let places = places else {
      return []
    }

    let annotations = places.compactMap { item -> MarkerObject? in
      let marker = MarkerObject()
      marker.latitude = item.placemark.coordinate.latitude
      marker.longitude = item.placemark.coordinate.longitude
      marker.markerTitle = item.name
      marker.opacity = 1
      marker.color = UIColor.clear
      marker.draggable = false
      return marker
    }
    return annotations
  }

  private func setMarkersDisplayRegion() {
    guard let region = searchResultRegion else {
      return
    }
    mapView.region = region
  }
}
