func formatUpdateUrl(_ permalink: String, _ message: String) -> String {
  let updatePermalink = "url=\(permalink.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"
  let updateMessage = "updateMessage=\(message.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"
  return "expo-dev-client://expo-development-client?\(updatePermalink)&\(updateMessage)"
}

/// Case-insensitive subsequence match: is `query` a subsequence of `text`?
func fuzzyMatch(_ query: String, in text: String) -> Bool {
  let query = query.lowercased()
  let text = text.lowercased()
  var index = query.startIndex
  for character in text where index < query.endIndex && character == query[index] {
    index = query.index(after: index)
  }
  return index == query.endIndex
}
