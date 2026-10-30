// Copyright 2024-present 650 Industries. All rights reserved.

import CoreMotion
import ExpoModulesCore

final class MotionActivityTaskConsumer: NSObject, EXTaskConsumerInterface {
  // Weak: `EXTask` holds this consumer strongly.
  weak var task: EXTaskInterface?
  private var streamTask: Task<Void, Never>?

  func taskType() -> String {
    return "motionActivity"
  }

  func didRegisterTask(_ task: EXTaskInterface) {
    self.task = task
    streamTask = Task { @MainActor [weak task] in
      let streamer = MotionActivityStreamer()
      defer { streamer.stopStreaming() }
      do {
        for try await activity in try streamer.streamMotionActivity() {
          task?.execute(withData: ["activity": activity.toMotionActivityDict()], withError: nil)
        }
      } catch {
        task?.execute(withData: nil, withError: error as NSError)
      }
    }
  }

  func didUnregister() {
    streamTask?.cancel()
    streamTask = nil
  }

  deinit {
    streamTask?.cancel()
  }
}
