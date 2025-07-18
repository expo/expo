// Copyright 2018-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

let taskManagerEventName = "TaskManager.executeTask"

public final class TaskManager: Module, EXTaskManagerInterface {

  private let appId: String
  private var eventsQueue: [Any]?
  private weak var eventEmitter: EXEventEmitterService?
  private weak var constantsService: EXConstantsInterface?
  private weak var taskService: EXTaskServiceInterface?

  public func definition() -> ModuleDefinition {
    Name("ExpoTaskManager")

    Constants([
      "EVENT_NAME": taskManagerEventName
    ])

    Events([taskManagerEventName])

    AsyncFunction("isAvailableAsync") { () -> Bool in
      return self.taskService != nil
    }

    AsyncFunction("notifyTaskFinishedAsync") { (taskName: String, response: [String: Any]) in
      self.taskService?.notifyTask(withName: taskName, forAppId: self.appId, didFinishWithResponse: response)
    }

    AsyncFunction("isTaskRegisteredAsync") { (taskName: String) -> Bool in
      return self.hasRegisteredTask(withName: taskName)
    }

    AsyncFunction("getRegisteredTasksAsync") { () -> [String: Any]? in
      return taskService?.getRegisteredTasks(forAppId: self.appId) as? [String: Any] ?? [:]
    }

    AsyncFunction("getTaskOptionsAsync") { (taskName: String) -> [String: Any]? in
      return taskService?.getOptionsForTaskName(taskName, forAppId: self.appId) as? [String: Any] ?? [:]
    }

    AsyncFunction("unregisterTaskAsync") { (taskName: String) in
      self.unregisterTask(withName: taskName, consumerClass: nil)
    }

    AsyncFunction("unregisterAllTasksAsync") { () in
      self.taskService?.unregisterAllTasks(forAppId: self.appId)
    }

    OnStartObserving {
      self.startObserving()
    }

    OnStopObserving {
      self.stopObserving()
    }
  }

  public required init(appContext: AppContext) {
    self.appId = "mainApplication"
    self.eventsQueue = []
    super.init(appContext: appContext)
  }

  @objc public convenience init(scopeKey: String) {
    // This initializer is kept for compatibility but will use the AppContext initializer internally
    // In real implementation, you'd need to get the AppContext from somewhere
    fatalError("Use init(appContext:) instead")
  }

  public func setModuleRegistry(_ moduleRegistry: ModuleRegistry) {
    eventEmitter = appContext?.legacyModuleRegistry?.getModuleImplementingProtocol(EXEventEmitterService.self) as? EXEventEmitterService
    constantsService = appContext?.legacyModuleRegistry?.getModuleImplementingProtocol(EXConstantsInterface.self) as? EXConstantsInterface
    taskService = appContext?.legacyModuleRegistry?.getSingletonModule(forName: "TaskService") as? EXTaskServiceInterface

    // Register task manager in task service
    guard let appUrl = findAppUrl() else {
      fatalError("appUrl must not be nil")
    }
    taskService?.setTaskManager(self, forAppId: appId, withUrl: appUrl)
  }

  public func startObserving() {
    if let eventsQueue = eventsQueue, !eventsQueue.isEmpty {
      // Emit queued events
      for eventBody in eventsQueue {
        eventEmitter?.sendEvent(withName: taskManagerEventName, body: eventBody)
      }
    }
    eventsQueue = nil
  }

  public func stopObserving() {
    // No-op
  }

  public func hasRegisteredTask(withName taskName: String) -> Bool {
    return taskService?.hasRegisteredTask(withName: taskName, forAppId: appId) ?? false
  }

  public func task(withName taskName: String, hasConsumerOf consumerClass: AnyClass) -> Bool {
    return taskService?.task(withName: taskName, forAppId: appId, hasConsumerOf: consumerClass) ?? false
  }

  public func registerTask(withName taskName: String, consumer consumerClass: AnyClass, options: [AnyHashable : Any] = [:]) {
    guard let appUrl = findAppUrl() else {
      fatalError("appUrl must not be nil")
    }
    
    taskService?.registerTask(withName: taskName, appId: appId, appUrl: appUrl, consumerClass: consumerClass, options: options)
  }

  public func unregisterTask(withName taskName: String, consumerClass: AnyClass?) {
    taskService?.unregisterTask(withName: taskName, forAppId: appId, consumerClass: consumerClass)
  }

  public func hasBackgroundModeEnabled(_ backgroundMode: String) -> Bool {
    return TaskService.hasBackgroundModeEnabled(backgroundMode)
  }

  public func execute(withBody body: [AnyHashable : Any]) {
    if eventsQueue == nil {
      // Module's event emitter is already being observed, so we can send events
      eventEmitter?.sendEvent(withName: taskManagerEventName, body: body)
    } else {
      // Otherwise add event body to the queue (it will be sent in startObserving)
      eventsQueue?.append(body)
    }
  }

  public func isRunningInHeadlessMode() -> Bool {
    let constants = constantsService?.constants() ?? [:]
    return (constants["isHeadless"] as? Bool) ?? false
  }

  private func findAppUrl() -> String? {
    // TODO(@tsapeta): find app url for vanilla RN apps
    let constants = constantsService?.constants() ?? [:]
    return constants["experienceUrl"] as? String
  }
}
