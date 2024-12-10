import MapKit
import ExpoModulesCore

class AppleMapsPOI: NSObject, PointsOfInterests {
  private var pointsOfInterestSearchCompleter: AppleMapsPOISearchCompleter
  private var pointsOfInterestSearchService: AppleMapsPOISearch
  private var pointsOfInterestSearchController: AppleMapsPOISearchController
  private var poiFilterCategories: [MKPointOfInterestCategory]?
  private var enabledPOIDisplay: Bool?

  private var mapView: MKMapView
  private var markers: AppleMapsMarkers

  init(mapView: MKMapView, markers: AppleMapsMarkers) {
    self.mapView = mapView
    self.markers = markers

    pointsOfInterestSearchCompleter = AppleMapsPOISearchCompleter(delegate: nil)
    pointsOfInterestSearchService = AppleMapsPOISearch(mapView: mapView, markers: markers)
    pointsOfInterestSearchController = AppleMapsPOISearchController(searchService: pointsOfInterestSearchService)
  }

  func fetchSearchCompletions(searchQueryFragment: String, promise: Promise) {
    pointsOfInterestSearchCompleter.setSearchCompleterRegion(region: mapView.region)
    pointsOfInterestSearchCompleter.autoComplete(searchQueryFragment: searchQueryFragment, promise: promise)
  }

  func createSearchRequest(place: String) {
    guard !place.isEmpty, let placeTitle = getPlaceTitleFromCompletion(place: place) else {
      markers.detachAndDeletePOIMarkers()
      return
    }
    pointsOfInterestSearchService.createSearchRequest(for: placeTitle)
  }

  private func getPlaceTitleFromCompletion(place: String) -> String? {
    let tmpStr = place.components(separatedBy: ";")
    return tmpStr[0]
  }

  func setEnabledPOISearching(enabled: Bool) {
    if enabled {
      pointsOfInterestSearchController.enablePOISearchController(mapView: mapView)
    } else {
      pointsOfInterestSearchController.disablePOISearchController()
    }
  }

  // dispaying poi on map
  func setEnabledPOIs(enabled: Bool) {
    enabledPOIDisplay = enabled
    if enabled {
      mapView.pointOfInterestFilter = getMKPOIFilter()
    } else {
      mapView.pointOfInterestFilter = MKPointOfInterestFilter.excludingAll
    }
  }
}

// adding filter with specified categories
extension AppleMapsPOI {
  func setEnabledPOIFilter(categories: [POICategoryType]) {
    if categories.isEmpty {
      poiFilterCategories = nil
    } else {
      poiFilterCategories = categories.compactMap(mapToMKPOICategories)
    }
    let filter = getMKPOIFilter()

    pointsOfInterestSearchService.setPointsOfInterestCategories(categories: poiFilterCategories)
    pointsOfInterestSearchCompleter.setSearchCompleterFilters(filter: filter)
    if enabledPOIDisplay ?? false {
      mapView.pointOfInterestFilter = filter
    }
  }

  private func getMKPOIFilter() -> MKPointOfInterestFilter {
    var filter: MKPointOfInterestFilter
    if let categories = poiFilterCategories {
      filter = MKPointOfInterestFilter.init(including: categories)
    } else {
      filter = MKPointOfInterestFilter.includingAll
    }
    return filter
  }

  private func mapToMKPOICategories(category: POICategoryType) -> MKPointOfInterestCategory {
    switch category {
    case .airport:
      return .airport
    case .atm:
      return  .atm
    case .bank:
      return .bank
    case .beach:
      return .beach
    case .cafe:
      return .cafe
    case .hospital:
      return .hospital
    case .hotel:
      return .hotel
    case .museum:
      return .museum
    case .pharmacy:
      return .pharmacy
    case .store:
      return .store
    case .zoo:
      return .zoo
    }
  }
}
