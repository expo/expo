// Copyright 2024-present 650 Industries. All rights reserved.

import CoreMotion
import ExpoModulesCore

class MotionActivityTaskConsumer: NSObject, EXTaskConsumerInterface {
  var task: EXTaskInterface?
  private let streamer = MotionActivityStreamer()

  func taskType() -> String {
    return "motionActivity"
  }

  func didRegisterTask(_ task: EXTaskInterface) {
    self.task = task

    Task {
      do {
        for try await activity in try streamer.streamMotionActivity() {
          // CMMotionActivity reports one confidence value for the whole reading.
          // Detected entries receive that confidence; undetected entries receive 0 (Low).
          let confidence = activity.confidence.rawValue
          func entry(_ detected: Bool) -> [String: Any] {
            ["detected": detected, "confidence": detected ? confidence : 0]
          }
          self.task?.execute(withData: [
            "activity": [
              "activities": [
                "automotive": entry(activity.automotive),
                "cycling":    entry(activity.cycling),
                "running":    entry(activity.running),
                "walking":    entry(activity.walking),
                "stationary": entry(activity.stationary),
                "unknown":    entry(activity.unknown),
              ],
              "timestamp": activity.startDate.timeIntervalSince1970 * 1000
            ]
          ], withError: nil)
        }
      } catch {
        self.task?.execute(withData: nil, withError: error as NSError)
      }
    }
  }

  func didUnregister() {
    streamer.stopStreaming()
  }
}
