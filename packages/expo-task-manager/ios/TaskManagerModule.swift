// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

public typealias AppId = String
public typealias TaskName = String

public final class TaskManagerModule: Module, EXTaskManagerInterface {
  let appId: AppId = "main"
  var eventsQueue = [[AnyHashable: Any]]()

  public func definition() -> ModuleDefinition {
    Name("ExpoTaskManager")

    Events("TaskManager.executeTask")

    OnCreate {
      EXTaskService.shared.setTaskManager(self, forAppId: appId, withUrl: findAppUrl())
    }

    Constant("EVENT_NAME") {
      return "TaskManager.executeTask"
    }

    AsyncFunction("isAvailableAsync") {
      // In the past it's been possible that the task service is not available.
      // Should we deprecate it?
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

  public func execute(withBody body: [AnyHashable: Any]) {
    if eventsQueue.isEmpty {
      appContext?.eventEmitter?.sendEvent(withName: "TaskManager.executeTask", body: body)
    } else {
      eventsQueue.append(body)
    }
  }

  public func isRunningInHeadlessMode() -> Bool {
    guard let isHeadless = appContext?.constants?.constants()["isHeadless"] as? Bool else {
      return false
    }
    return isHeadless
  }

  private func findAppUrl() -> String? {
    guard let experienceUrl = appContext?.constants?.constants()["experienceUrl"] as? String else {
      return nil
    }
    return experienceUrl
  }
}
