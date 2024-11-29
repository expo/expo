// Copyright 2024-present 650 Industries. All rights reserved.
import BackgroundTasks

/**
 This is a little helper class so that we can access the BackgroundTaskService from objective-c,
 specifically from our AppDelegate callback.
 */
@objc(BackgroundTaskService)
public class BackgroundTaskService: NSObject {
    @objc public static func supportsBackgroundTasks() -> Bool {
#if targetEnvironment(simulator)
      // If we're on emulator we should definetly return restricted
      return false
#else
      return true
#endif
  }
}
