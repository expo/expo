import GooglePlaces
import GoogleMaps
import ExpoModulesCore

class GoogleMapsPlaces: PointsOfInterests {
  private let mapView: GMSMapView
  private var markers: GoogleMapsMarkers
  private let placesClient: GMSPlacesClient
  private var tokenUtils: GoogleMapsPlacesTokenUtils
  private var placesSearchCompleter: GoogleMapsPlacesSearchCompleter
  private var placesFetcher: GooglePlacesFetchPlace

  init(mapView: GMSMapView, markers: GoogleMapsMarkers) {
    self.mapView = mapView
    self.markers = markers
    placesClient = GMSPlacesClient()
    tokenUtils = GoogleMapsPlacesTokenUtils()

    placesSearchCompleter = GoogleMapsPlacesSearchCompleter(placesClient: placesClient, tokenUtils: tokenUtils)
    placesFetcher = GooglePlacesFetchPlace(placesClient: placesClient, tokenUtils: tokenUtils, markers: markers, mapView: mapView)
  }

  func fetchSearchCompletions(searchQueryFragment: String, promise: Promise) {
    placesSearchCompleter.setSearchCompleterRegion(mapView: mapView)
    placesSearchCompleter.autoComplete(searchQueryFragment: searchQueryFragment, promise: promise)
  }

  func createSearchRequest(place: String) {
    guard !place.isEmpty, let placeId = getPlaceIdFromCompletion(place: place) else {
      markers.detachAndDeletePOIMarkers()
      return
    }
    placesFetcher.search(placeId: placeId)
  }

  private func getPlaceIdFromCompletion(place: String) -> String? {
    let tmpStr = place.components(separatedBy: ";")
    return tmpStr[1]
  }
}
