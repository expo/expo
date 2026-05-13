// Copyright 2024-present 650 Industries. All rights reserved.
import ExpoModulesCore

private let onTasksExpired = "onTasksExpired"
public let onTasksExpiredNotification = Notification.Name(onTasksExpired)

public class BackgroundTaskModule: Module {
  private lazy var taskManager: EXTaskManagerInterface? = appContext?.legacyModule(implementing: EXTaskManagerInterface.self)

  public func definition() -> ModuleDefinition {
    Name("ExpoBackgroundTask")

    Events(onTasksExpired)

    OnStartObserving(onTasksExpired) {
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(handleTasksExpiredNotification),
        name: onTasksExpiredNotification,
        object: nil)
    }

    OnStopObserving(onTasksExpired) {
      // swiftlint:disable:next notification_center_detachment
      NotificationCenter.default.removeObserver(self)
    }

    AsyncFunction("triggerTaskWorkerForTestingAsync") {
      BackgroundTaskDebugHelper.triggerBackgroundTaskTest()
    }

    AsyncFunction("registerTaskAsync") { (name: String, options: [String: Any]) in
      guard let taskManager else {
        throw TaskManagerNotFound()
      }

      if !BackgroundTaskScheduler.supportsBackgroundTasks() {
        throw BackgroundTasksRestricted()
      }

      if !taskManager.hasBackgroundModeEnabled("processing") {
        throw BackgroundTasksNotConfigured()
      }

      // Register task
      taskManager.registerTask(
        withName: name, consumer: BackgroundTaskConsumer.self, options: options)
    }

    AsyncFunction("unregisterTaskAsync") { (name: String) in
      guard let taskManager else {
        throw TaskManagerNotFound()
      }

      if !BackgroundTaskScheduler.supportsBackgroundTasks() {
        throw BackgroundTasksRestricted()
      }

      if !taskManager.hasBackgroundModeEnabled("processing") {
        throw BackgroundTasksNotConfigured()
      }

      try EXUtilities.catchException {
        taskManager.unregisterTask(withName: name, consumerClass: BackgroundTaskConsumer.self)
      }
    }

    AsyncFunction("getStatusAsync") {
      return BackgroundTaskScheduler.supportsBackgroundTasks()
        ? BackgroundTaskStatus.available : .restricted
    }
  }

  @objc func handleTasksExpiredNotification(_ notification: Notification) {
    guard let url = notification.userInfo?["url"] as? URL else {
      return
    }
    self.sendEvent(onTasksExpired, [:])
  }
}
