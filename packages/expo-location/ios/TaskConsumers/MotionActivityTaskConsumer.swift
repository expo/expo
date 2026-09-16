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
          self.task?.execute(withData: ["activity": activity.toMotionActivityDict()], withError: nil)
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
