import ExpoModulesCore

class Insights {
  static let shared = Insights()
  private var sentEvents: Set<String> = []

  private init() {}

  func send(event: String, at timestamp: Date) {
    log.info("Insights: \(event) at \(timestamp.timeIntervalSince1970)")
  }

  func sendOnce(event: String, at timestamp: Date) {
    if !sentEvents.contains(event) {
      sentEvents.insert(event)
      send(event: event, at: timestamp)
    }
  }
}
