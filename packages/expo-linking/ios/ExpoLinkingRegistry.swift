typealias OnURLReceivedCallback = (URL) -> Void

class ExpoLinkingRegistry {
  static let shared = ExpoLinkingRegistry()
  var initialURL: URL?

  private init() { }
}
