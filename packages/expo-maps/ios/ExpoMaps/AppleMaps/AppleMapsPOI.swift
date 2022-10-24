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
    if (enabled) {
      pointsOfInterestSearchController.enablePOISearchController(mapView: mapView)
    } else {
      pointsOfInterestSearchController.disablePOISearchController()
    }
  }
  
  //dispaying poi on map
  @available(iOS 13.0, *)
  func setEnabledPOIs(enabled: Bool) {
    enabledPOIDisplay = enabled
    if (enabled) {
      mapView.pointOfInterestFilter = getMKPOIFilter()
    } else {
      mapView.pointOfInterestFilter = MKPointOfInterestFilter.excludingAll
    }
  }

}

//adding filter with specified categories
@available(iOS 13.0, *)
extension AppleMapsPOI {
  
  func setEnabledPOIFilter(categories: [POICategoryType]) {
    if (categories.isEmpty) {
      poiFilterCategories = nil
    } else {
      poiFilterCategories = categories.compactMap(mapToMKPOICategories)
    }
    let filter = getMKPOIFilter()
    
    pointsOfInterestSearchService.setPointsOfInterestCategories(categories: poiFilterCategories)
    pointsOfInterestSearchCompleter.setSearchCompleterFilters(filter: filter)
    if (enabledPOIDisplay ?? false) {
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
    var mappedCategory: MKPointOfInterestCategory
    switch category {
      case .airport:
        mappedCategory = .airport
      case .atm:
        mappedCategory = .atm
      case .bank:
        mappedCategory = .bank
      case .beach:
        mappedCategory = .beach
      case .cafe:
        mappedCategory = .cafe
      case .hospital:
        mappedCategory = .hospital
      case .hotel:
        mappedCategory = .hotel
      case .museum:
        mappedCategory = .museum
      case .pharmacy:
        mappedCategory = .pharmacy
      case .store:
        mappedCategory = .store
      case .zoo:
        mappedCategory = .zoo
    }
    return mappedCategory
  }
  
}
