import CoreLocation

final class TemporaryFullAccuracyRequester {
  private lazy var manager = CLLocationManager.makeOnMainThread()
  private var pendingRaise: Task<Void, Never>?

  @MainActor
  func raiseIfReduced(purposeKey: String) async {
    if let pendingRaise {
      await pendingRaise.value
      return
    }
    let isGranted = manager.authorizationStatus == .authorizedWhenInUse || manager.authorizationStatus == .authorizedAlways
    guard isGranted, manager.accuracyAuthorization == .reducedAccuracy else {
      return
    }
    let task = Task { @MainActor in
      await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
        manager.requestTemporaryFullAccuracyAuthorization(withPurposeKey: purposeKey) { _ in
          continuation.resume()
        }
      }
    }
    pendingRaise = task
    await task.value
    pendingRaise = nil
  }
}
