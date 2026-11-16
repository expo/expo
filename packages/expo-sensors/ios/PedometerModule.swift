// Copyright 2023-present 650 Industries. All rights reserved.

import CoreMotion
import ExpoModulesCore

// `@Event` needs a string literal, so it repeats this name.
private let EVENT_PEDOMETER_UPDATE = "Exponent.pedometerUpdate"

private struct PedometerWatch {
  let startDate: Date
  let handler: CMPedometerHandler
}

// This class should always be kept in sync with PedometerModuleDisabled
@ExpoModule("ExponentPedometer")
public final class PedometerModule: Module {
  private lazy var pedometer = CMPedometer()

  // The listening hooks run on the JavaScript thread, and the app lifecycle hooks on the main thread.
  private let watch = Mutex<PedometerWatch?>(nil)
  private var eventHandler: CMPedometerEventHandler?

  @Event("Exponent.pedometerUpdate")
  var onPedometerUpdate: (PedometerResult) -> Void

  @Event("Exponent.pedometerEvent")
  var onPedometerEvent: (PedometerEvent) -> Void

  @JS
  func isAvailableAsync() async -> Bool {
    if MotionPermissionRequester.isMotionPermissionDisabled() {
      return false
    }
    return CMPedometer.isStepCountingAvailable()
  }

  @JS
  func isRecordingAvailableAsync() async -> Bool {
    // iOS keeps collecting history automatically (up to seven days), so recording is
    // effectively "available" whenever step counting is available.
    if MotionPermissionRequester.isMotionPermissionDisabled() {
      return false
    }
    return CMPedometer.isStepCountingAvailable()
  }

  @JS
  func isEventTrackingAvailableAsync() async -> Bool {
    if MotionPermissionRequester.isMotionPermissionDisabled() {
      return false
    }
    return CMPedometer.isPedometerEventTrackingAvailable()
  }

  // CoreMotion calls the event handler on its own queue, so `eventHandler` is only used on the main queue.
  @JS
  @MainActor
  func startEventUpdatesAsync() async throws -> Bool {
    if eventHandler != nil {
      return true
    }

    guard !MotionPermissionRequester.isMotionPermissionDisabled(),
      CMPedometer.isPedometerEventTrackingAvailable() else {
      return false
    }

    let authorizationStatus = CMPedometer.authorizationStatus()
    guard authorizationStatus == .authorized else {
      throw PedometerMotionPermissionException(authorizationStatus)
    }

    let handler = makeEventHandler()
    pedometer.startEventUpdates(handler: handler)
    eventHandler = handler
    return true
  }

  @JS
  @MainActor
  func stopEventUpdatesAsync() async {
    pedometer.stopEventUpdates()
    eventHandler = nil
  }

  // iOS does not expose a way to start recording history
  @JS
  func subscribeRecordingAsync() async {}

  // iOS does not expose a way to stop recording history
  @JS
  func unsubscribeRecordingAsync() async {}

  // CoreMotion calls the completion handler on its own queue. `.concurrent` removes the JavaScript
  // actor isolation from this function, so the handler isn't isolated to that actor either.
  @JS(.concurrent)
  func getStepCountAsync(startTime: Double, endTime: Double) async throws -> PedometerResult {
    let startDate = Date(timeIntervalSince1970: startTime / 1000.0)
    let endDate = Date(timeIntervalSince1970: endTime / 1000.0)

    return try await withCheckedThrowingContinuation { continuation in
      pedometer.queryPedometerData(from: startDate, to: endDate) { data, error in
        if let error {
          continuation.resume(throwing: PedometerQueryException().causedBy(error))
        } else {
          continuation.resume(returning: PedometerResult(steps: data?.numberOfSteps.intValue ?? 0))
        }
      }
    }
  }

  @JS
  func getPermissionsAsync() async throws -> [String: Any] {
    return try await MotionPermissionRequester.getPermissionsAsync(appContext: appContext)
  }

  @JS
  func requestPermissionsAsync() async throws -> [String: Any] {
    return try await MotionPermissionRequester.requestPermissionsAsync(appContext: appContext)
  }

  public override func didCreate() {
    appContext?.permissions?.register([MotionPermissionRequester()])
  }

  public override func didStartListening(event: String) {
    guard event == EVENT_PEDOMETER_UPDATE else {
      return
    }
    let startDate = Date()
    let handler: CMPedometerHandler = { [weak self] data, _ in
      guard let data else {
        return
      }
      self?.onPedometerUpdate(PedometerResult(steps: data.numberOfSteps.intValue))
    }

    pedometer.startUpdates(from: startDate, withHandler: handler)
    watch.withLock { $0 = PedometerWatch(startDate: startDate, handler: handler) }
  }

  public override func didStopListening(event: String) {
    guard event == EVENT_PEDOMETER_UPDATE else {
      return
    }
    stopUpdates()
    watch.withLock { $0 = nil }
  }

  public override func appDidEnterBackground() {
    stopUpdates()
  }

  public override func appWillEnterForeground() {
    // If needed, restart updates after going back from background
    if let watch = watch.withLock({ $0 }) {
      pedometer.startUpdates(from: watch.startDate, withHandler: watch.handler)
    }
  }

  public override func willDestroy() {
    stopUpdates()
    pedometer.stopEventUpdates()
    eventHandler = nil
  }

  // Not isolated to the main actor, because CoreMotion calls the handler on its own queue.
  private func makeEventHandler() -> CMPedometerEventHandler {
    return { [weak self] event, error in
      if error != nil {
        DispatchQueue.main.async {
          self?.pedometer.stopEventUpdates()
          self?.eventHandler = nil
        }
        return
      }

      guard let self, let event else {
        return
      }

      let type: PedometerEventType
      switch event.type {
      case .pause:
        type = .pause
      case .resume:
        type = .resume
      @unknown default:
        return
      }

      self.onPedometerEvent(PedometerEvent(type: type, date: event.date.timeIntervalSince1970 * 1000))
    }
  }

  private func stopUpdates() {
    guard watch.withLock({ $0 != nil }),
      let permissions = appContext?.permissions,
      permissions.hasGrantedPermission(usingRequesterClass: MotionPermissionRequester.self) else {
      return
    }

    pedometer.stopUpdates()
  }
}

internal final class PedometerQueryException: Exception {
  override var reason: String {
    "An error occurred while querying pedometer data"
  }
}

internal final class PedometerMotionPermissionException: GenericException<CMAuthorizationStatus>, @unchecked Sendable {
  override var reason: String {
    switch param {
    case .notDetermined:
      return "Motion permission is required to start pedometer event updates. Call `Pedometer.requestPermissionsAsync()` first."
    case .denied, .restricted:
      return "Motion permission has not been granted for pedometer event updates."
    default:
      return "Motion permission is required to start pedometer event updates."
    }
  }
}
