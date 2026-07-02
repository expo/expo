// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class GeofencingModule: Module {
  private var taskManager: EXTaskManagerInterface {
    get throws {
      guard let taskManager: EXTaskManagerInterface = appContext?.legacyModule(implementing: EXTaskManagerInterface.self) else {
        throw Exceptions.TaskManagerUnavailable()
      }
      return taskManager
    }
  }
  private lazy var monitor: GeofencingMonitor = {
    if #available(iOS 17.0, *) {
      return CLMonitorGeofencing(appContext: appContext)
    } else {
      return CLLocationManagerGeofencing(appContext: appContext)
    }
  }()
  
  public func definition() -> ModuleDefinition {
    Name("ExpoLocationGeofencing")
    
    OnDestroy {
      Task {
        await monitor.cleanup()
      }
    }
    
    AsyncFunction("addCallbackAsync") { (location: GeofencingRegion, callback: JavaScriptFunction<Void>) async in
      return await monitor.add(location: location, callback: callback)
    }

    AsyncFunction("removeCallbackAsync") { (id: String) async in
      return await monitor.remove(id: id)
    }
    
    AsyncFunction("startTaskAsync") { (name: String, regions: [GeofencingRegion]) in
      let regionsDict = regions.map { $0.legacyDict }
      try taskManager.registerTask(withName: name, consumer: EXGeofencingTaskConsumer.self, options: ["regions": regionsDict])
    }
    
    AsyncFunction("stopTaskAsync") { (name: String) in
      try taskManager.unregisterTask(withName: name, consumerClass: EXGeofencingTaskConsumer.self)
    }

    AsyncFunction("hasTaskStartedAsync") { (name: String) -> Bool in
      return try taskManager.task(withName: name, hasConsumerOf: EXGeofencingTaskConsumer.self)
    }
  }
}
