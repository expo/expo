// Copyright 2024-present 650 Industries. All rights reserved.
import ExpoModulesCore
import BackgroundTasks

let ModuleName = "ExpoBackgroundTask"

public class BackgroundTaskModule: Module {
  
  public func definition() -> ModuleDefinition {
    Name(ModuleName)
    Events(BackgroundTaskConstants.EVENT_PERFORM_WORK)
    
    Constants(["EVENT_PERFORM_WORK": BackgroundTaskConstants.EVENT_PERFORM_WORK])
    
    OnCreate {
      BackgroundTaskService.setRunTasksHandler {
        self.sendEvent(BackgroundTaskConstants.EVENT_PERFORM_WORK)
      }
    }
    
    OnDestroy {
      BackgroundTaskService.clearRunTasksHandler()
    }
    
    AsyncFunction("startWorkerAsync") {
      try BackgroundTaskScheduler.tryScheduleWorker()
    }
    
    AsyncFunction("stopWorkerAsync") {
      BackgroundTaskScheduler.stopWorker()
    }
    
    AsyncFunction("isWorkerRunningAsync") { () async -> Bool in
      return await BackgroundTaskScheduler.isWorkerRunning()
    }
    
    AsyncFunction("initialiseFromJS") {
      await BackgroundTaskService.checkForPendingTaskWorkerRequests()
    }
    
    AsyncFunction("workFinished") {
      // Mark as done
      try BackgroundTaskService.markTaskAsFinished()
      
      // Re-schedule task
      try BackgroundTaskScheduler.tryScheduleWorker()
    }
    
    AsyncFunction("getStatusAsync") {
      return BackgroundTaskService.isBackgroundTaskSupported() ?
        BackgroundTaskStatus.available : .restricted
    }
  }
}

