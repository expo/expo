// Copyright 2019 650 Industries. All rights reserved.

import ExpoModulesCore
import EXUpdatesInterface

let e2eEventName = "Expo.updatesE2EStateChangeEvent"

public final class E2ETestModule: Module, UpdatesStateChangeListener {
  private let methodQueue = DispatchQueue(label: "expo.modules.EXUpdatesQueue")
  private var updatesController: (any UpdatesInterface)?
  private var hasListener: Bool = false
  private var subscriptionId: String? = nil

  public func updatesStateDidChange(_ event: [String : Any]) {
    if (hasListener) {
      sendEvent(e2eEventName, event)
    }
  }

  public required init(appContext: AppContext) {
    super.init(appContext: appContext)
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoUpdatesE2ETest")

    Events([e2eEventName])

    OnCreate {
      if let controller = UpdatesControllerRegistry.sharedInstance.controller {
        updatesController = controller
        subscriptionId = controller.subscribeToUpdatesStateChanges(self)
      }
    }

    OnStartObserving(e2eEventName) {
      hasListener = true
    }

    OnStopObserving(e2eEventName) {
      hasListener = false
    }

    OnDestroy {
      if let subscriptionId,
         let updatesController {
        updatesController.unsubscribeFromUpdatesStateChanges(subscriptionId)
      }
      updatesController = nil
    }

    Function("getLaunchedUpdateId") {
      return updatesController?.launchedUpdateId
    }

    Function("getEmbeddedUpdateId") {
      return updatesController?.embeddedUpdateId
    }

    Function("getRuntimeVersion") {
      return updatesController?.runtimeVersion
    }

    AsyncFunction("readInternalAssetsFolderAsync") { (promise: Promise) in
      guard let assetsFolder = AppController.sharedInstance.updatesDirectory else {
        promise.reject("ERR_UPDATES_E2E_READ", "No updatesDirectory initialized")
        return
      }

      FileDownloader.assetFilesQueue.async {
        var contents: [String]
        do {
          contents = try FileManager.default.contentsOfDirectory(atPath: assetsFolder.path)
        } catch {
          promise.reject("ERR_UPDATES_E2E_READ", error.localizedDescription)
          return
        }
        let count = contents.filter { file in
          return !(file.hasPrefix("expo-") && (file.hasSuffix(".db") || file.contains(".db-")))
        }.count
        promise.resolve(count)
      }
    }

    AsyncFunction("clearInternalAssetsFolderAsync") { (promise: Promise) in
      guard let assetsFolder = AppController.sharedInstance.updatesDirectory else {
        promise.reject("ERR_UPDATES_E2E_CLEAR", "No updatesDirectory initialized")
        return
      }

      FileDownloader.assetFilesQueue.async {
        var contents: [String]
        do {
          contents = try FileManager.default.contentsOfDirectory(atPath: assetsFolder.path)
        } catch {
          promise.reject("ERR_UPDATES_E2E_CLEAR", error.localizedDescription)
          return
        }
        let files = contents.filter { file in
          return !(file.hasPrefix("expo-") && (file.hasSuffix(".db") || file.contains(".db-")))
        }

        for file in files {
          let filePath = assetsFolder.appendingPathComponent(file).path
          do {
            try FileManager.default.removeItem(atPath: filePath)
          } catch {
            promise.reject("ERR_UPDATES_E2E_CLEAR", error.localizedDescription)
            return
          }
        }

        promise.resolve(nil)
      }
    }
  }
}
