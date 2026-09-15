import CoreLocation
import ExpoModulesCore

internal enum TemporaryFullAccuracyPlistKeys {
  static let purposeDictionary = "NSLocationTemporaryUsageDescriptionDictionary"
  static let purposeKey = "ExpoLocationFullAccuracy"

  static func containsPurposeKey(_ purposeKey: String) -> Bool {
    guard let dictionary = Bundle.main.object(forInfoDictionaryKey: purposeDictionary) as? [String: Any] else {
      return false
    }
    return dictionary[purposeKey] != nil
  }
}

internal final class TemporaryFullAccuracyRequester {
  private let manager: CLLocationManager

  @MainActor
  init() {
    manager = CLLocationManager()
  }

  @MainActor
  func raiseIfReduced(purposeKey: String) async throws {
    let isGranted = manager.authorizationStatus == .authorizedWhenInUse || manager.authorizationStatus == .authorizedAlways
    guard isGranted, manager.accuracyAuthorization == .reducedAccuracy else {
      return
    }
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      manager.requestTemporaryFullAccuracyAuthorization(withPurposeKey: purposeKey) { error in
        // The system reports `promptDeclined` both when the user declines the prompt and when it
        // decides not to show one at all, for example when the app already has full accuracy.
        if let error, !Self.isPromptDeclined(error) {
          continuation.resume(throwing: TemporaryFullAccuracyFailedException().causedBy(error))
          return
        }
        continuation.resume()
      }
    }
  }

  private static func isPromptDeclined(_ error: Error) -> Bool {
    return (error as? CLError)?.code == .promptDeclined
  }
}
