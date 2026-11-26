// Copyright 2024-present 650 Industries. All rights reserved.
import BackgroundTasks

final class BackgroundTaskDebugHelper {
  static func triggerBackgroundTaskTest() {
#if DEBUG
    let selector = NSSelectorFromString("_simulate".appending("LaunchForTaskWithIdentifier:"))

    if let method = class_getInstanceMethod(BGTaskScheduler.self, selector) {
      typealias MethodImplementation = @convention(c) (AnyObject, Selector, String) -> Void
      let implementation = unsafeBitCast(method_getImplementation(method), to: MethodImplementation.self)

      implementation(BGTaskScheduler.shared, selector, BackgroundTaskConstants.BackgroundWorkerIdentifier)
    } else {
      print("BackgroundTaskScheduler: _simulateLaunchForTaskWithIdentifier method not found on BGTaskScheduler.")
    }
#else
    fatalError("Triggering background tasks are not allowed in release builds.")
#endif
  }
}
