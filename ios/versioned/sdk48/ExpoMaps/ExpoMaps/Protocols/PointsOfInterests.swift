import ABI48_0_0ExpoModulesCore

protocol PointsOfInterests {
  func fetchSearchCompletions(searchQueryFragment: String, promise: Promise)
  func createSearchRequest(place: String)
}
