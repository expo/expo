//  Copyright © 2025 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MachO

public class BackgroundModule: Module {
  var taskManager: EXTaskManagerInterface?

  public func definition() -> ModuleDefinition {
    Name("ExpoBackgroundNotificationTasksModule")

    OnCreate {
      taskManager = appContext?.legacyModule(implementing: EXTaskManagerInterface.self)
    }

    AsyncFunction("registerTaskAsync") {(name: String, promise: Promise) in
      guard let taskManager else {
        promise.reject(
          "E_BACKGROUND_REMOTE_NOTIFICATIONS_DISABLED",
          "TaskManager not found. Are you sure that Expo modules are properly linked?"
        )
        return
      }

      if !taskManager.hasBackgroundModeEnabled("remote-notification") {
        promise.reject(
          "E_BACKGROUND_REMOTE_NOTIFICATIONS_DISABLED",
          "Background remote notifications have not been configured. " +
          "To enable it, set the `enableBackgroundRemoteNotifications` parameter " +
          "in the expo-notifications config plugin, or add `remote-notification` to " +
          "`UIBackgroundModes` in the application's Info.plist file."
        )
        return
      }

      taskManager.registerTask(withName: name, consumer: NotificationsBackgroundTaskConsumer.self, options: [:])

      promise.resolve(nil)
    }

    AsyncFunction("unregisterTaskAsync") {(name: String, promise: Promise) in
      try EXUtilities.catchException {
        self.taskManager?.unregisterTask(withName: name, consumerClass: NotificationsBackgroundTaskConsumer.self)
      }
      promise.resolve(nil)
    }
  }
}
