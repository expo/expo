import CoreLocation

final class TemporaryFullAccuracyRequester {
  private lazy var manager = CLLocationManager.makeOnMainThread()
  private var pendingRaise: Task<Void, Never>?

  @MainActor
  func raiseIfReduced(purposeKey: String, for kind: LocationPermissionKind) async {
    if let pendingRaise {
      await pendingRaise.value
      return
    }
    let isGranted = kind.grantingStatuses.contains(manager.authorizationStatus)
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
