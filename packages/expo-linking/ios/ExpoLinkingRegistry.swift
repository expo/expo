typealias OnURLRecievedCallback = (URL) -> Void

class ExpoLinkingRegistry {
  static let shared = ExpoLinkingRegistry()
  var initialURL: URL?
  var onURLReceived: OnURLRecievedCallback?

  private init() { }
}
