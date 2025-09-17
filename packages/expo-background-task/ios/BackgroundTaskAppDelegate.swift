// Copyright 2018-present 650 Industries. All rights reserved.

import Foundation
import BackgroundTasks
import ExpoModulesCore

public class BackgroundTaskAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    if BackgroundTaskScheduler.supportsBackgroundTasks() {
      BGTaskScheduler.shared.register(forTaskWithIdentifier: BackgroundTaskConstants.BackgroundWorkerIdentifier, using: nil) { task in
        log.debug("Expo Background Tasks - starting background work")

        // Set up expiration handler
        task.expirationHandler = { ()
          log.warn("Expo Background Tasks - task expired")
          task.setTaskCompleted(success: false)
        }

        // Let's find the task service implementation and call the runTasks(withReason)
        if let taskService = ModuleRegistryProvider.singletonModules().first(where: { $0 is EXTaskServiceInterface }) as? EXTaskServiceInterface {
          taskService.runTasks(with: EXTaskLaunchReasonBackgroundTask, userInfo: nil, completionHandler: { _ in
            // Mark iOS task as finished - this is important so that we can continue calling it
            task.setTaskCompleted(success: true)

            // Reschedule
            Task {
              do {
                log.debug("Background task successfully finished. Rescheduling")
                try await BackgroundTaskScheduler.tryScheduleWorker()
              } catch {
                log.error("Could not reschedule the worker after task finished: \(error.localizedDescription)")
              }
            }
          })
        } else {
          task.setTaskCompleted(success: false)
          log.error("Expo Background Tasks: Could not find TaskService module")
        }
      }

      // Signal to the scheduler that we're done.
      BackgroundTaskScheduler.bgTaskSchedulerDidFinishRegister()
    }

    return true
  }
}
