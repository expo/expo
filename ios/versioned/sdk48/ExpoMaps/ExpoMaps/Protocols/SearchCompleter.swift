protocol SearchCompleter {
  associatedtype CompletionsType
  func autoComplete(searchQueryFragment: String)
  func getSearchCompletions() -> [String]
  func mapSearchCompletions(completions: [CompletionsType]) -> [String]
}
