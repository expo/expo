// Copyright 2018-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore
import UMAppLoader
import UIKit

@objc(EXTaskService)
public class TaskService: EXSingletonModule, EXTaskServiceInterface, EXTaskDelegate {
    // MARK: - Properties

    // Array of task requests that are being executed
    private var requests: [TaskExecutionRequest] = []

    // Table of registered tasks. Schema: { "<appId>": { "<taskName>": EXTask } }
    private var tasks: [String: [String: EXTask]] = [:]

    // Dictionary with app records of running background apps. Schema: { "<appId>": UMAppRecordInterface }
    private var appRecords: [String: UMAppRecordInterface] = [:]

    // MapTable with task managers of running (foregrounded) apps. Schema: { "<appId>": EXTaskManagerInterface }
    private var taskManagers: NSMapTable<NSString, EXTaskManagerInterface> = NSMapTable.strongToWeakObjects()

    // Same as above but for headless (backgrounded) apps.
    private var headlessTaskManagers: NSMapTable<NSString, EXTaskManagerInterface> = NSMapTable.strongToWeakObjects()

    // Dictionary with events queues storing event bodies that should be passed to the manager as soon as it's available.
    // Schema: { "<appId>": [<eventBodies...>] }
    private var eventsQueues: [String: [[AnyHashable: Any]]] = [:]

    // Storing events per app. Schema: { "<appId>": [<eventIds...>] }
    private var events: [String: [String]] = [:]

    // MARK: - EXSingletonModule

    @objc public override class func name() -> String {
        return "TaskService"
    }

    @objc public override init() {
        super.init()
    }

    // MARK: - EXTaskServiceInterface

    @objc public func hasRegisteredTask(withName taskName: String, forAppId appId: String) -> Bool {
        return getTask(withName: taskName, forAppId: appId) != nil
    }

    @objc public func registerTask(withName taskName: String,
                                  appId: String,
                                  appUrl: String,
                                  consumerClass: AnyClass,
                                  options: [AnyHashable: Any]?) {
      let unversionedConsumerClass: AnyClass = unversionedClass(from: consumerClass)

      // Given consumer class doesn't conform to EXTaskConsumerInterface protocol
      guard let consumerProtocol = NSProtocolFromString("EXTaskConsumerInterface"),
            class_conformsToProtocol(unversionedConsumerClass, consumerProtocol) else {
          let reason = "Invalid `consumer` argument. It must be a class that conforms to EXTaskConsumerInterface protocol."
          let exception = NSException(name: NSExceptionName("E_INVALID_TASK_CONSUMER"), reason: reason, userInfo: nil)
          exception.raise()
          return
      }

      let task = getTask(withName: taskName, forAppId: appId)

      if let existingTask = task,
         type(of: existingTask.consumer) == unversionedConsumerClass {
          // Task already exists. Let's just update its options.
          existingTask.options = options

          if existingTask.consumer.responds(to: #selector(EXTaskConsumerInterface.setOptions(_:))) {
            existingTask.consumer.setOptions!(options ?? [:])
          }
      } else {
          let newTask = internalRegisterTask(withName: taskName,
                                           appId: appId,
                                           appUrl: appUrl,
                                           consumerClass: unversionedConsumerClass,
                                           options: options)
          addTaskToConfig(newTask)
      }
  }

  @objc public func unregisterTask(withName taskName: String,
                                  forAppId appId: String,
                                  consumerClass: AnyClass?) {
      guard let task = getTask(withName: taskName, forAppId: appId) else {
          let reason = "Task '\(taskName)' not found for app ID '\(appId)'."
          let exception = NSException(name: NSExceptionName("E_TASK_NOT_FOUND"), reason: reason, userInfo: nil)
          exception.raise()
          return
      }

      if let consumerClass = consumerClass {
        let unversionedConsumerClass: AnyClass = unversionedClass(from: consumerClass)
          if type(of: task.consumer) != unversionedConsumerClass {
              let reason = "Invalid task consumer. Cannot unregister task with name '\(taskName)' because it is associated with different consumer class."
              let exception = NSException(name: NSExceptionName("E_INVALID_TASK_CONSUMER"), reason: reason, userInfo: nil)
              exception.raise()
              return
          }
      }

      var appTasks = getTasksForAppId(appId)
      appTasks.removeValue(forKey: taskName)

      if appTasks.isEmpty {
          tasks.removeValue(forKey: appId)
      } else {
          tasks[appId] = appTasks
      }

      if task.consumer.responds(to: #selector(EXTaskConsumerInterface.didUnregister)) {
          task.consumer.didUnregister!()
      }
      removeTaskFromConfig(taskName, appId: appId)
  }

  @objc public func unregisterAllTasks(forAppId appId: String) {
      guard let appTasks = tasks[appId] else { return }

      // Call `didUnregister` on task consumers
      for task in appTasks.values {
          if task.consumer.responds(to: #selector(EXTaskConsumerInterface.didUnregister)) {
            task.consumer.didUnregister!()
          }
      }

      tasks.removeValue(forKey: appId)

      // Remove the app from the config in user defaults.
      removeFromConfigApp(withId: appId)
  }

    @objc public func task(withName taskName: String,
                          forAppId appId: String,
                           hasConsumerOf consumerClass: AnyClass) -> Bool {
        guard let task = getTask(withName: taskName, forAppId: appId) else { return false }
      let unversionedConsumerClass: AnyClass = unversionedClass(from: consumerClass)
      return type(of: task.consumer) == unversionedConsumerClass
    }

  @objc public func getOptionsForTaskName(_ taskName: String, forAppId appId: String) -> [AnyHashable: Any]? {
        let task = getTask(withName: taskName, forAppId: appId)
        return task?.options
    }

    @objc public func getRegisteredTasks(forAppId appId: String?) -> [Any] {
      guard let nonNilAppId = appId else {
        fatalError("appId must not be nil")
      }
      let appTasks = getTasksForAppId(nonNilAppId)
        var results: [[AnyHashable: Any]] = []

        for (taskName, task) in appTasks {
            let taskInfo: [AnyHashable: Any] = [
                "taskName": taskName,
                "taskType": task.consumer.taskType(),
                "options": task.options ?? [:]
            ]
            results.append(taskInfo)
        }
        return results
    }

    @objc public func notifyTask(withName taskName: String,
                                forAppId appId: String,
                                didFinishWithResponse response: [AnyHashable: Any]) {
        guard let task = getTask(withName: taskName, forAppId: appId) else { return }
        let eventId = response["eventId"] as? String ?? ""
        var result = response["result"]

        if task.consumer.responds(to: #selector(EXTaskConsumerInterface.normalizeTaskResult(_:))) {
          result = NSNumber(value: task.consumer.normalizeTaskResult!(result))
        }
        if task.consumer.responds(to: #selector(EXTaskConsumerInterface.didFinish)) {
          task.consumer.didFinish!()
        }

        // Inform requests about finished tasks
        for request in requests {
            if request.isIncludingTask(task) {
                request.task(task, didFinishWithResult: result ?? NSNull())
            }
        }

        // Remove event and maybe invalidate related app record
        if var appEvents = events[appId] {
            appEvents.removeAll { $0 == eventId }

            if appEvents.isEmpty {
                events.removeValue(forKey: appId)

                // Invalidate app record but after 1 seconds delay so we can still take batched events.
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
                    if self?.events[appId] == nil {
                        self?.invalidateApp(withId: appId)
                    }
                }
            } else {
                events[appId] = appEvents
            }
        }
    }

  @objc public func setTaskManager(_ taskManager: EXTaskManagerInterface,
                                    forAppId appId: String,
                                    withUrl appUrl: String) {
        let taskManager = taskManager

        // Determine in which table the task manager will be stored.
        // Having two tables for them is to prevent race condition problems,
        // when both foreground and background apps are launching at the same time.
        let isHeadless = taskManager.isRunningInHeadlessMode()
        let taskManagersTable = isHeadless ? headlessTaskManagers : taskManagers

        // Set task manager in appropriate table.
        taskManagersTable.setObject(taskManager, forKey: appId as NSString)

        // Execute events waiting for the task manager.
        if let appEventQueue = eventsQueues[appId] {
            for body in appEventQueue {
                taskManager.execute(withBody: body)
            }
        }

        // Remove events queue for that app.
        eventsQueues.removeValue(forKey: appId)

        if !isHeadless {
            // Maybe update app url in user defaults. It might change only in non-headless mode.
            maybeUpdateAppUrl(appUrl, forAppId: appId)
        }
    }

    // MARK: - EXTaskDelegate

    @objc public func executeTask(_ task: EXTaskInterface,
                                 withData data: [AnyHashable: Any]?,
                                 withError error: Error?) {
        let taskManager = taskManagerForAppId(task.appId)
        let executionInfo = executionInfo(forTask: task)
        let body: [AnyHashable: Any] = [
            "executionInfo": executionInfo,
            "data": data ?? [:],
            "error": exportError(error) ?? NSNull()
        ]

        print("EXTaskService: Executing task '\(task.name)' for app '\(task.appId)'.")

        // Save an event so we can keep tracking events for this app
        var appEvents = events[task.appId] ?? []
        appEvents.append(executionInfo["eventId"] as! String)
        events[task.appId] = appEvents

        if let taskManager = taskManager {
            // Task manager is initialized and can execute events
            taskManager.execute(withBody: body)
            return
        }

        if appRecords[task.appId] == nil {
            // No app record yet - let's spin it up!
            loadApp(withId: task.appId, appUrl: task.appUrl)
        }

        // App record for that app exists, but it's not fully loaded as its task manager is not there yet.
        // We need to add event's body to the queue from which events will be executed once the task manager is ready.
        var appEventsQueue = eventsQueues[task.appId] ?? []
        appEventsQueue.append(body)
        eventsQueues[task.appId] = appEventsQueue
    }

    // MARK: - Static methods

    @objc public static func hasBackgroundModeEnabled(_ backgroundMode: String) -> Bool {
        guard let backgroundModes = Bundle.main.infoDictionary?["UIBackgroundModes"] as? [String] else {
            return false
        }
        return backgroundModes.contains(backgroundMode)
    }

    // MARK: - AppDelegate handlers

    @objc public func applicationDidFinishLaunching(withOptions launchOptions: [AnyHashable: Any]?) {
        restoreTasks()

        let launchReason = launchReason(forLaunchOptions: launchOptions)
      runTasks(with: launchReason, userInfo: launchOptions, completionHandler: nil)
    }

  @objc public func runTasks(with launchReason: EXTaskLaunchReason,
                              userInfo: [AnyHashable: Any]?,
                              completionHandler: ((UIBackgroundFetchResult) -> Void)?) {
        runTasksSupporting(launchReason: launchReason, userInfo: userInfo) { results in
            guard let completionHandler = completionHandler else { return }

            var wasCompletionCalled = false

            // Iterate through the array of results. If there is at least one "NewData" or "Failed" result,
            // then just call completionHandler immediately with that value, otherwise return "NoData".
            for result in results {
                if let fetchResult = result as? NSNumber {
                    let backgroundFetchResult = UIBackgroundFetchResult(rawValue: fetchResult.uintValue)!

                    if backgroundFetchResult == .newData || backgroundFetchResult == .failed {
                        completionHandler(backgroundFetchResult)
                        wasCompletionCalled = true
                        break
                    }
                }
            }
            if !wasCompletionCalled {
                completionHandler(.noData)
            }
        }
    }

    // MARK: - Private methods

    private func getTask(withName taskName: String, forAppId appId: String) -> EXTask? {
        return getTasksForAppId(appId)[taskName]
    }

    private func getTasksForAppId(_ appId: String) -> [String: EXTask] {
        return tasks[appId] ?? [:]
    }

    @discardableResult
    private func internalRegisterTask(withName taskName: String,
                                     appId: String,
                                     appUrl: String,
                                     consumerClass: AnyClass,
                                     options: [AnyHashable: Any]?) -> EXTask {
        var appTasks = getTasksForAppId(appId)
        let task = EXTask(name: taskName,
                         appId: appId,
                         appUrl: appUrl,
                         consumerClass: consumerClass,
                         options: options,
                         delegate: self)

        appTasks[taskName] = task
        tasks[appId] = appTasks
        task.consumer.didRegisterTask(task)
        return task
    }

    private func addTaskToConfig(_ task: EXTaskInterface) {
        var dict = dictionaryWithRegisteredTasks() ?? [:]
        var appDict = dict[task.appId] as? [String: Any] ?? [:]
        var tasks = appDict["tasks"] as? [String: [String: Any]] ?? [:]
        let taskDict = dictionary(fromTask: task)

        tasks[task.name] = taskDict
        appDict["tasks"] = tasks
        if !task.appUrl.isEmpty {
            appDict["appUrl"] = task.appUrl
        }
        dict[task.appId] = appDict
        saveConfig(withDictionary: dict)
    }

    private func removeTaskFromConfig(_ taskName: String, appId: String) {
        guard var dict = dictionaryWithRegisteredTasks() else { return }
        guard var appDict = dict[appId] as? [String: Any] else { return }
        guard var tasks = appDict["tasks"] as? [String: Any] else { return }

        tasks.removeValue(forKey: taskName)

        if tasks.isEmpty {
            dict.removeValue(forKey: appId)
        } else {
            appDict["tasks"] = tasks
            dict[appId] = appDict
        }
        saveConfig(withDictionary: dict)
    }

    private func removeFromConfigApp(withId appId: String) {
        guard var dict = dictionaryWithRegisteredTasks() else { return }

        if dict[appId] != nil {
            dict.removeValue(forKey: appId)
            saveConfig(withDictionary: dict)
        }
    }

    private func saveConfig(withDictionary dict: [String: Any]) {
        // Uses required reason API based on the following reason: CA92.1
        let userDefaults = UserDefaults.standard
        userDefaults.set(sanitizeDict(forUserDefaults: dict), forKey: String(describing: type(of: self)))
        userDefaults.synchronize()
    }

    private func iterateTasksUsing(block: (EXTaskInterface) -> Void) {
        for (_, appTasks) in tasks {
            for (_, task) in appTasks {
                block(task)
            }
        }
    }

    private func dictionaryWithRegisteredTasks() -> [String: Any]? {
        let userDefaults = UserDefaults.standard
        return userDefaults.dictionary(forKey: String(describing: type(of: self)))
    }

    private func dictionary(fromTask task: EXTaskInterface) -> [String: Any] {
        return [
            "name": task.name,
            "consumerClass": unversionedClassName(fromClass: type(of: task.consumer)),
            "consumerVersion": consumerVersion(type(of: task.consumer)),
            "options": task.options ?? NSNull()
        ]
    }

    private func runTasksSupporting(launchReason: EXTaskLaunchReason,
                                   userInfo: [AnyHashable: Any]?,
                                   callback: @escaping ([Any]) -> Void) {
        var request: TaskExecutionRequest!
        request = TaskExecutionRequest { [weak self] results in
            callback(results)
            if let self = self, let index = self.requests.firstIndex(of: request) {
                self.requests.remove(at: index)
            }
        }

        requests.append(request)

        iterateTasksUsing { task in
          let consumerClass: AnyClass = type(of: task.consumer)
          let selector = NSSelectorFromString("supportsLaunchReason:")

          if let nsType = consumerClass as? NSObject.Type,
             nsType.responds(to: selector) {
            let result = nsType.perform(selector, with: launchReason)
            if let boolResult = result?.takeUnretainedValue() as? Bool, boolResult {
              // it's supported
              self.addTask(task, toRequest: request, withInfo: userInfo)
            }
          }
        }

        // Evaluate request immediately if no tasks were added.
        request.maybeEvaluate()
    }

    private func loadApp(withId appId: String, appUrl: String) {
        guard let appLoader = UMAppLoaderProvider.sharedInstance().createAppLoader("react-native-experience"),
              !appUrl.isEmpty else { return }

        print("EXTaskService: Loading headless app '\(appId)' with url '\(appUrl)'.")

        let appRecord = appLoader.loadApp(withUrl: appUrl, options: nil) { [weak self] success, error in
            if !success {
                print("EXTaskService: Loading app '\(appId)' from url '\(appUrl)' failed. Error description: \(error?.localizedDescription ?? "Unknown")")
                self?.events.removeValue(forKey: appId)
                self?.eventsQueues.removeValue(forKey: appId)
                self?.appRecords.removeValue(forKey: appId)

                // Host unreachable? Unregister all tasks for that app.
                self?.unregisterAllTasks(forAppId: appId)
            }
        }

        appRecords[appId] = appRecord
    }

    private func taskManagerForAppId(_ appId: String) -> EXTaskManagerInterface? {
        if let taskManager = taskManagers.object(forKey: appId as NSString) {
            return taskManager
        }
        return headlessTaskManagers.object(forKey: appId as NSString)
    }

    private func maybeUpdateAppUrl(_ appUrl: String, forAppId appId: String) {
        guard var dict = dictionaryWithRegisteredTasks() else { return }
        guard var appDict = dict[appId] as? [String: Any] else { return }

        let oldAppUrl = appDict["appUrl"] as? String

        if oldAppUrl != appUrl {
            appDict["appUrl"] = appUrl
            dict[appId] = appDict
            saveConfig(withDictionary: dict)
        }
    }

    private func restoreTasks() {
        guard let config = dictionaryWithRegisteredTasks() else { return }

        // Log restored config so it's debuggable
        print("EXTaskService: Restoring tasks configuration: \(config)")

        for (appId, appConfigAny) in config {
            guard let appConfig = appConfigAny as? [String: Any],
                  let tasksConfig = appConfig["tasks"] as? [String: [String: Any]],
                  let appUrl = appConfig["appUrl"] as? String else { continue }

            for (taskName, taskConfig) in tasksConfig {
                guard let consumerClassName = taskConfig["consumerClass"] as? String,
                      let consumerClass = NSClassFromString(consumerClassName) else {
                    print("EXTaskService: Cannot restore task '\(taskName)' because consumer class doesn't exist.")
                    removeTaskFromConfig(taskName, appId: appId)
                    continue
                }

                let currentConsumerVersion = self.consumerVersion(consumerClass)
                let previousConsumerVersion = taskConfig["consumerVersion"] as? Int ?? 0

                // Check whether the current consumer class is compatible with the saved version
                if currentConsumerVersion == previousConsumerVersion {
                    internalRegisterTask(withName: taskName,
                                       appId: appId,
                                       appUrl: appUrl,
                                       consumerClass: consumerClass,
                                       options: taskConfig["options"] as? [AnyHashable: Any])
                } else {
                    print("EXTaskService: Task consumer '\(consumerClassName)' has version '\(currentConsumerVersion)' that is not compatible with the saved version '\(previousConsumerVersion)'.")
                    removeTaskFromConfig(taskName, appId: appId)
                }
            }
        }
    }

    private func addTask(_ task: EXTaskInterface,
                        toRequest request: TaskExecutionRequest,
                        withInfo info: [AnyHashable: Any]?) {
        request.addTask(task)

        // Inform the consumer that the task can be executed from then on.
        // Some types of background tasks (like background fetch) may execute the task immediately.
      if task.consumer.responds(to: #selector(EXTaskConsumerInterface.didBecomeReadyToExecute)) {
        task.consumer.didBecomeReadyToExecute!(withData: info ?? [:])
      }
    }

    private func executionInfo(forTask task: EXTaskInterface) -> [String: Any] {
        let appState = exportAppState(UIApplication.shared.applicationState)
        return [
            "eventId": UUID().uuidString,
            "taskName": task.name,
            "appState": appState
        ]
    }

    private func invalidateApp(withId appId: String) {
        guard let appRecord = appRecords[appId] else { return }

        appRecord.invalidate()
        appRecords.removeValue(forKey: appId)
        headlessTaskManagers.removeObject(forKey: appId as NSString)
    }

    private func exportError(_ error: Error?) -> [String: Any]? {
        guard let error = error else { return nil }
        return [
            "code": (error as NSError).code,
            "message": error.localizedDescription
        ]
    }

    private func launchReason(forLaunchOptions launchOptions: [AnyHashable: Any]?) -> EXTaskLaunchReason {
        guard let launchOptions = launchOptions else { return EXTaskLaunchReasonUser }

        if launchOptions[UIApplication.LaunchOptionsKey.bluetoothCentrals] != nil {
            return EXTaskLaunchReasonBluetoothCentrals
        }
        if launchOptions[UIApplication.LaunchOptionsKey.bluetoothPeripherals] != nil {
            return EXTaskLaunchReasonBluetoothPeripherals
        }
        if launchOptions[UIApplication.LaunchOptionsKey.location] != nil {
            return EXTaskLaunchReasonLocation
        }
        if launchOptions[UIApplication.LaunchOptionsKey.newsstandDownloads] != nil {
            return EXTaskLaunchReasonNewsstandDownloads
        }
        if launchOptions[UIApplication.LaunchOptionsKey.remoteNotification] != nil {
            return EXTaskLaunchReasonRemoteNotification
        }
        return EXTaskLaunchReasonUnrecognized
    }

    private func exportAppState(_ appState: UIApplication.State) -> String {
        switch appState {
        case .active:
            return "active"
        case .inactive:
            return "inactive"
        case .background:
            return "background"
        @unknown default:
            return "unknown"
        }
    }

    private func consumerVersion(_ consumerClass: AnyClass) -> Int {

      let selector = NSSelectorFromString("taskConsumerVersion:")

      if consumerClass.responds(to: selector) {
            return Int(consumerClass.taskConsumerVersion())
        }
        return 0
    }

    private func unversionedClassName(fromClass versionedClass: AnyClass) -> String {
        let versionedClassName = NSStringFromClass(versionedClass)
        let regex = try! NSRegularExpression(pattern: "^ABI\\d+_\\d+_\\d+")
        return regex.stringByReplacingMatches(in: versionedClassName,
                                            options: [],
                                            range: NSRange(location: 0, length: versionedClassName.count),
                                            withTemplate: "")
    }

    private func unversionedClass(from versionedClass: AnyClass) -> AnyClass {
        let unversionedClassName = unversionedClassName(fromClass: versionedClass)
        return NSClassFromString(unversionedClassName) ?? versionedClass
    }

    // MARK: - Sanitization methods

    private func sanitizeDict(forUserDefaults dict: [String: Any]) -> [String: Any] {
        var sanitized: [String: Any] = [:]

        for (key, value) in dict {
            if value is String || value is NSNumber || value is Data || value is Date {
                sanitized[key] = value
            } else if let arrayValue = value as? [Any] {
                sanitized[key] = sanitizeArray(forUserDefaults: arrayValue)
            } else if let dictValue = value as? [String: Any] {
                sanitized[key] = sanitizeDict(forUserDefaults: dictValue)
            } else if value is NSNull {
                // Skip NSNull
                continue
            }
            // Skip other types
        }

        return sanitized
    }

    private func sanitizeArray(forUserDefaults array: [Any]) -> [Any] {
        var sanitized: [Any] = []

        for obj in array {
            if obj is String || obj is NSNumber || obj is Data || obj is Date {
                sanitized.append(obj)
            } else if let arrayValue = obj as? [Any] {
                sanitized.append(sanitizeArray(forUserDefaults: arrayValue))
            } else if let dictValue = obj as? [String: Any] {
                sanitized.append(sanitizeDict(forUserDefaults: dictValue))
            } else if obj is NSNull {
                // Skip NSNull
                continue
            }
            // Skip other types
        }

        return sanitized
    }
}
