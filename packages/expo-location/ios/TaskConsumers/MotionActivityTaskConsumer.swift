// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

// EXTaskService saves registered tasks under this class's runtime name and deletes saved tasks
// whose class it cannot find, so the class stays in ExpoLocation under its original name.
final class MotionActivityTaskConsumer: NSObject, EXTaskConsumerInterface {
  // Weak: `EXTask` holds this consumer strongly.
  weak var task: EXTaskInterface?
  private var watch: MotionActivityWatch?

  func taskType() -> String {
    return "motionActivity"
  }

  func didRegisterTask(_ task: EXTaskInterface) {
    self.task = task
    guard let provider = MotionActivityRegistry.provider else {
      task.execute(withData: nil, withError: Exceptions.MotionActivityCompanionMissing())
      return
    }
    watch = provider.watchActivity(
      onActivity: { [weak task] activity in
        task?.execute(withData: ["activity": activity], withError: nil)
      },
      onUnauthorized: { [weak task] in
        task?.execute(withData: nil, withError: Exceptions.MotionActivityUnauthorized())
      }
    )
  }

  func didUnregister() {
    watch?.stop()
    watch = nil
  }
}
