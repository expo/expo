import CoreLocation

final class TemporaryFullAccuracyRequester {
  private let manager: CLLocationManager

  @MainActor
  init() {
    manager = CLLocationManager()
  }

  @MainActor
  func raiseIfReduced(purposeKey: String) async {
    let isGranted = manager.authorizationStatus == .authorizedWhenInUse || manager.authorizationStatus == .authorizedAlways
    guard isGranted, manager.accuracyAuthorization == .reducedAccuracy else {
      return
    }
    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      manager.requestTemporaryFullAccuracyAuthorization(withPurposeKey: purposeKey) { _ in
        continuation.resume()
      }
    }
  }
}
