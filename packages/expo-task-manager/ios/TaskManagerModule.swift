// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

public typealias AppId = String
public typealias TaskName = String

private let EXECUTE_TASK_EVENT_NAME = "TaskManager.executeTask"

public final class TaskManagerModule: Module, EXTaskManagerInterface {
  let appId: AppId = "mainApplication"
  var eventsQueue: [[String: Any]]? = []

  public func definition() -> ModuleDefinition {
    Name("ExpoTaskManager")

    Events(EXECUTE_TASK_EVENT_NAME)

    OnCreate {
      EXTaskService.shared.setTaskManager(self, forAppId: appId, withUrl: findAppUrl())
    }

    Constant("EVENT_NAME") {
      return EXECUTE_TASK_EVENT_NAME
    }

    OnStartObserving(EXECUTE_TASK_EVENT_NAME) {
      // When `OnStartObserving` is called, the app is ready to execute new tasks.
      // It sends all events that were queued before this call.
      if let eventsQueue {
        for eventBody in eventsQueue {
          sendEvent(EXECUTE_TASK_EVENT_NAME, eventBody)
        }
      }
      // We will not need the queue anymore.
      eventsQueue = nil
    }

    AsyncFunction("isAvailableAsync") {
      return true
    }

    AsyncFunction("notifyTaskFinishedAsync") { (taskName: TaskName, response: [String: Any]) in
      EXTaskService.shared.notifyTask(withName: taskName, forAppId: appId, didFinishWithResponse: response)
    }

    AsyncFunction("isTaskRegisteredAsync") { (taskName: TaskName) in
      return hasRegisteredTask(withName: taskName)
    }

    AsyncFunction("getRegisteredTasksAsync") {
      return EXTaskService.shared.getRegisteredTasks(forAppId: appId)
    }

    AsyncFunction("getTaskOptionsAsync") { (taskName: TaskName) in
      return EXTaskService.shared.getOptionsForTaskName(taskName, forAppId: appId)
    }

    AsyncFunction("unregisterTaskAsync") { (taskName: TaskName) in
      try EXUtilities.catchException {
        self.unregisterTask(withName: taskName, consumerClass: nil)
      }
    }

    AsyncFunction("unregisterAllTasksAsync") {
      EXTaskService.shared.unregisterAllTasks(forAppId: appId)
    }
  }

  // MARK: - EXTaskManagerInterface

  public func hasRegisteredTask(withName taskName: TaskName) -> Bool {
    return EXTaskService.shared.hasRegisteredTask(withName: taskName, forAppId: appId)
  }

  public func task(withName taskName: TaskName, hasConsumerOf consumerClass: AnyClass) -> Bool {
    return EXTaskService.shared.task(withName: taskName, forAppId: appId, hasConsumerOf: consumerClass)
  }

  public func registerTask(withName taskName: TaskName, consumer consumerClass: AnyClass, options: [AnyHashable: Any] = [:]) {
    let appUrl = findAppUrl()
    EXTaskService.shared.registerTask(withName: taskName, appId: appId, appUrl: appUrl, consumerClass: consumerClass, options: options)
  }

  public func unregisterTask(withName taskName: TaskName, consumerClass: AnyClass?) {
    EXTaskService.shared.unregisterTask(withName: taskName, forAppId: appId, consumerClass: consumerClass)
  }

  public func hasBackgroundModeEnabled(_ backgroundMode: String) -> Bool {
    return EXTaskService.hasBackgroundModeEnabled(backgroundMode)
  }

  public func execute(withBody body: [String: Any]) {
    if var eventsQueue {
      // The module was created, but JS is not listening for events yet.
      // In that case we need to queue them up.
      eventsQueue.append(body)
    } else {
      // JS is already listening to the event, we can emit it straight away.
      sendEvent(EXECUTE_TASK_EVENT_NAME, body)
    }
  }

  public func isRunningInHeadlessMode() -> Bool {
    return appContext?.constants?.constants()["isHeadless"] as? Bool ?? false
  }

  private func findAppUrl() -> String? {
    return appContext?.constants?.constants()["experienceUrl"] as? String
  }
}
