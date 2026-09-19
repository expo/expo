// Copyright 2024-present 650 Industries. All rights reserved.

import CoreMotion
import ExpoModulesCore

internal final class MotionActivityStreamer {
  typealias MotionActivityStream = AsyncThrowingStream<CMMotionActivity, Error>

  private let manager = CMMotionActivityManager()
  private var activityStream: MotionActivityStream?
  private var continuation: MotionActivityStream.Continuation?

  deinit {
    if continuation != nil {
      stopStreaming()
    }
  }

  func streamMotionActivity() throws -> MotionActivityStream {
    if let stream = activityStream {
      return stream
    }
    let stream = MotionActivityStream { continuation in
      self.continuation = continuation
      self.manager.startActivityUpdates(to: .main) { [weak self] activity in
        guard let self else { return }
        if let activity {
          self.continuation?.yield(activity)
        } else if CMMotionActivityManager.authorizationStatus() == .denied
          || CMMotionActivityManager.authorizationStatus() == .restricted
        {
          self.continuation?.finish(throwing: Exceptions.MotionActivityUnauthorized())
          self.activityStream = nil
          self.continuation = nil
        }
        // nil update with .notDetermined or .authorized is a transient gap - skip it.
      }
    }
    activityStream = stream
    return stream
  }

  func stopStreaming() {
    manager.stopActivityUpdates()
    continuation?.finish()
    activityStream = nil
    continuation = nil
  }
}

extension CMMotionActivity {
  /**
   * Converts this reading into the `MotionActivityObject` wire format shared by the foreground
   * `watchMotionActivityAsync` event and the background `MotionActivityTaskConsumer`.
   */
  func toMotionActivityDict() -> [String: Any] {
    // CMMotionActivity reports one confidence value for the whole reading.
    // Detected entries receive that confidence; undetected entries receive 0 (Low).
    let confidence = self.confidence.rawValue
    func entry(_ detected: Bool) -> [String: Any] {
      ["detected": detected, "confidence": detected ? confidence : 0]
    }
    return [
      "activities": [
        "automotive": entry(automotive),
        "cycling":    entry(cycling),
        "running":    entry(running),
        "walking":    entry(walking),
        "stationary": entry(stationary),
        "unknown":    entry(unknown),
      ],
      "timestamp": startDate.timeIntervalSince1970 * 1000
    ]
  }
}
