import MapKit
import ExpoModulesCore

class AppleMapsPOISearchCompleter: NSObject, SearchCompleter {
  private var searchCompleter = MKLocalSearchCompleter()
  private var searchCompleterResults: [MKLocalSearchCompletion]?
  private var searchCompletionsPromise: Promise?

  init(delegate: MKLocalSearchCompleterDelegate?) {
    super.init()
    let delegate = delegate ?? self
    searchCompleter.delegate = delegate
  }

  func autoComplete(searchQueryFragment: String) {
    searchCompleter.queryFragment = searchQueryFragment
  }

  func autoComplete(searchQueryFragment: String, promise: Promise) {
    searchCompletionsPromise = promise
    searchCompleter.queryFragment = searchQueryFragment
  }

  func getSearchCompletions() -> [String] {
    if let results = searchCompleterResults {
      return mapSearchCompletions(completions: results)
    }
    return []
  }

  func setSearchCompleterRegion(region: MKCoordinateRegion) {
    searchCompleter.region = region
  }

  func setSearchCompleterFilters(filter: MKPointOfInterestFilter?) {
    searchCompleter.resultTypes = .pointOfInterest
    guard let filter = filter else {
      searchCompleter.pointOfInterestFilter = nil
      return
    }
    searchCompleter.pointOfInterestFilter = filter
  }

  private func resolveSearchCompletionsPromise() {
    guard searchCompletionsPromise != nil else {
      return
    }

    if let results = searchCompleterResults {
      let searchCompletions = mapSearchCompletions(completions: results)
      searchCompletionsPromise?.resolve(searchCompletions)
    } else {
      let errorMessage = "Error while fetching search completions."
      searchCompletionsPromise?.reject("", errorMessage)
    }
    searchCompletionsPromise = nil
  }

  func mapSearchCompletions(completions: [MKLocalSearchCompletion]) -> [String] {
    var stringCompletions: [String] = []
    for completion in completions {
      stringCompletions.append(completion.title + ";" + completion.subtitle)
    }
    return stringCompletions
  }
}

extension AppleMapsPOISearchCompleter: MKLocalSearchCompleterDelegate {
  func completerDidUpdateResults(_ completer: MKLocalSearchCompleter) {
    searchCompleterResults = completer.results
    resolveSearchCompletionsPromise()
  }
}
