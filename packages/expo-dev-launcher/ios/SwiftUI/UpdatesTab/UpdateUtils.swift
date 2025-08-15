func formatUpdateUrl(_ permalink: String, _ message: String) -> String {
  let updatePermalink = "url=\(permalink.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"
  let updateMessage = "updateMessage=\(message.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"
  return "expo-dev-client://expo-development-client?\(updatePermalink)&\(updateMessage)"
}
