// Copyright 2024-present 650 Industries. All rights reserved.
import ExpoModulesCore

public class BackgroundTaskModule: Module {
  private var taskManager: EXTaskManagerInterface?

  public func definition() -> ModuleDefinition {
    Name("ExpoBackgroundTask")

    OnCreate {
      taskManager = appContext?.legacyModule(implementing: EXTaskManagerInterface.self)
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
      taskManager.registerTask(withName: name, consumer: BackgroundTaskConsumer.self, options: options)
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

      taskManager.unregisterTask(withName: name, consumerClass: BackgroundTaskConsumer.self)
    }

    AsyncFunction("getStatusAsync") {
      return BackgroundTaskScheduler.supportsBackgroundTasks() ?
        BackgroundTaskStatus.available : .restricted
    }

    OnAppEntersBackground {
      Task {
        // Try start worker when app enters background
        do {
          try await BackgroundTaskScheduler.tryScheduleWorker()
        } catch {
          log.error("Could not schedule the worker: \(error.localizedDescription)")
        }
      }
    }

    OnAppEntersForeground {
      Task {
        // When entering foreground we'll stop the worker
        await BackgroundTaskScheduler.stopWorker()
      }
    }
  }
}
