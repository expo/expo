protocol SearchCompleter {
  associatedtype T
  func autoComplete(searchQueryFragment: String)
  func getSearchCompletions() -> [String]
  func mapSearchCompletions(completions: [T]) -> [String]
}
