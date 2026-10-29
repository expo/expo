import Foundation

enum GeofencingEventState: String {
  case inside
  case outside
}

struct GeofencingEvent {
  let identifier: String
  let state: GeofencingEventState
  let timestamp: Double

  init(identifier: String, state: GeofencingEventState, date: Date) {
    self.identifier = identifier
    self.state = state
    self.timestamp = date.timeIntervalSince1970 * 1000
  }

  func toDictionary() -> [String: Any] {
    return [
      "identifier": identifier,
      "state": state.rawValue,
      "timestamp": timestamp
    ]
  }
}
