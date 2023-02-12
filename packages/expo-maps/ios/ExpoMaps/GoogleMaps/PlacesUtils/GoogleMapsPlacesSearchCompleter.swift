import GooglePlaces
import GoogleMaps
import ExpoModulesCore

class GoogleMapsPlacesSearchCompleter: SearchCompleter {
  private var placesClient: GMSPlacesClient
  private var tokenUtils: GoogleMapsPlacesTokenUtils
  private var searchCompleterResults: [GMSAutocompletePrediction]?
  private var filter = GMSAutocompleteFilter()

  init(placesClient: GMSPlacesClient, tokenUtils: GoogleMapsPlacesTokenUtils) {
    self.placesClient = placesClient
    self.tokenUtils = tokenUtils
  }

  func autoComplete(searchQueryFragment: String) {
    autoComplete(searchQueryFragment: searchQueryFragment, promise: nil)
  }

  func autoComplete(searchQueryFragment: String, promise: Promise?) {
    guard let token = tokenUtils.getToken() else {
      let errorMessage = "No token provided for auto complete request!"
      promise?.reject("", errorMessage)
      return
    }

    placesClient.findAutocompletePredictions(fromQuery: searchQueryFragment, filter: filter, sessionToken: token, callback: {results, error in
        if let error = error {
          let errorMessage = "Autocomplete error: \(error)"
          promise?.reject("", errorMessage)
          return
        }
        if let results = results {
          self.searchCompleterResults = results
        }
      }
    )

    if let promise = promise {
      resolveSearchCompletionsPromise(searchCompletionsPromise: promise)
    }
  }

  func getSearchCompletions() -> [String] {
    if let results = searchCompleterResults {
      return mapSearchCompletions(completions: results)
    }
    return []
  }

  func mapSearchCompletions(completions: [GMSAutocompletePrediction]) -> [String] {
    return completions.map { $0.attributedFullText.string + ";" + $0.placeID }
  }

  func setSearchCompleterFilters(filter: GMSAutocompleteFilter) {
    filter.type = .establishment
  }

  func setSearchCompleterRegion(mapView: GMSMapView) {
    let visibleRegion = mapView.projection.visibleRegion()
    let bounds = GMSCoordinateBounds(region: visibleRegion)
    let region = GMSPlaceRectangularLocationOption(bounds.northEast, bounds.southWest)
    filter.locationBias = region
  }

  private func resolveSearchCompletionsPromise(searchCompletionsPromise: Promise) {
    let results = getSearchCompletions()
    searchCompletionsPromise.resolve(results)
  }
}
