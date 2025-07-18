// Copyright 2018-present 650 Industries. All rights reserved.

import Foundation
import UIKit
import ExpoModulesCore

@objc(EXTaskManagerAppDelegate)
public class TaskManagerAppDelegate: EXSingletonModule, UIApplicationDelegate {

    // MARK: - EXSingletonModule

    @objc public override class func name() -> String {
        return "TaskManagerAppDelegate"
    }

    // MARK: - UIApplicationDelegate

    @objc public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        if let taskService = ModuleRegistryProvider.getSingletonModule(for: TaskService.self) as? TaskService {
            taskService.applicationDidFinishLaunching(withOptions: launchOptions)
        }

        return false
    }

    @objc public func application(_ application: UIApplication, performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        if let taskService = ModuleRegistryProvider.getSingletonModule(for: TaskService.self) as? TaskService {
            taskService.runTasks(with: EXTaskLaunchReasonBackgroundFetch, userInfo: nil, completionHandler: completionHandler)
        }
    }

    @objc public func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable: Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        if let taskService = ModuleRegistryProvider.getSingletonModule(for: TaskService.self) as? TaskService {
            taskService.runTasks(with: EXTaskLaunchReasonRemoteNotification, userInfo: userInfo, completionHandler: completionHandler)
        }
    }
}
