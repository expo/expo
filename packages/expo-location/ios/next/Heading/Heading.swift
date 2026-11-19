import ExpoModulesCore
import CoreLocation

@Record
struct Heading {
  var trueHeading: Double?
  var magneticHeading: Double
  var accuracy: Double?
  var timestamp: Double
}

extension Heading {
  func toEventPayload() -> [String: Any] {
    return [
      "trueHeading": nullable(trueHeading),
      "magneticHeading": magneticHeading,
      "accuracy": nullable(accuracy),
      "timestamp": timestamp
    ]
  }
}

private func nullable(_ value: Double?) -> Any {
  guard let value else {
    return NSNull()
  }
  return value
}

extension CLHeading {
  func toHeading() -> Heading {
    return Heading(
      trueHeading: trueHeading >= 0 ? trueHeading : nil,
      magneticHeading: magneticHeading,
      accuracy: headingAccuracy >= 0 ? headingAccuracy : nil,
      timestamp: timestamp.timeIntervalSince1970 * 1000
    )
  }
}
