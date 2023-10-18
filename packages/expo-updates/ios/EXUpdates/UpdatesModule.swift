// Copyright 2019 650 Industries. All rights reserved.

// swiftlint:disable closure_body_length
// swiftlint:disable superfluous_else

import ExpoModulesCore

/**
 * Exported module which provides to the JS runtime information about the currently running update
 * and updates state, along with methods to check for and download new updates, reload with the
 * newest downloaded update applied, and read/clear native log entries.
 *
 * Communicates with the updates hub (AppController in most apps, EXAppLoaderExpoUpdates in
 * Expo Go and legacy standalone apps) via EXUpdatesService, an internal module which is overridden
 * by EXUpdatesBinding, a scoped module, in Expo Go.
 */
public final class UpdatesModule: Module {
  private let methodQueue = UpdatesUtils.methodQueue

  public required init(appContext: AppContext) {
    super.init(appContext: appContext)
  }

  // swiftlint:disable cyclomatic_complexity
  public func definition() -> ModuleDefinition {
    Name("ExpoUpdates")

    Constants {
      let config = AppController.sharedInstance.config
      let releaseChannel = config.releaseChannel
      let channel = config.requestHeaders["expo-channel-name"] ?? ""
      let runtimeVersion = config.runtimeVersion ?? ""
      let checkAutomatically = config.checkOnLaunch.asString
      let isMissingRuntimeVersion = config.isMissingRuntimeVersion()

      guard AppController.sharedInstance.isStarted,
        let launchedUpdate = AppController.sharedInstance.launchedUpdate() else {
        return [
          "isEnabled": false,
          "isEmbeddedLaunch": false,
          "isMissingRuntimeVersion": isMissingRuntimeVersion,
          "releaseChannel": releaseChannel,
          "runtimeVersion": runtimeVersion,
          "checkAutomatically": checkAutomatically,
          "channel": channel
        ]
      }

      let database = AppController.sharedInstance.database
      let embeddedUpdate = EmbeddedAppLoader.embeddedManifest(withConfig: config, database: database)
      let isEmbeddedLaunch = embeddedUpdate != nil && embeddedUpdate?.updateId == launchedUpdate.updateId

      let commitTime = UInt64(floor(launchedUpdate.commitTime.timeIntervalSince1970 * 1000))
      return [
        "isEnabled": true,
        "isEmbeddedLaunch": isEmbeddedLaunch,
        "isUsingEmbeddedAssets": AppController.sharedInstance.isUsingEmbeddedAssets,
        "updateId": launchedUpdate.updateId.uuidString,
        "manifest": launchedUpdate.manifest.rawManifestJSON(),
        "localAssets": AppController.sharedInstance.assetFilesMap,
        "isEmergencyLaunch": AppController.sharedInstance.isEmergencyLaunch,
        "isMissingRuntimeVersion": isMissingRuntimeVersion,
        "releaseChannel": releaseChannel,
        "runtimeVersion": runtimeVersion,
        "checkAutomatically": checkAutomatically,
        "channel": channel,
        "commitTime": commitTime,
        "nativeDebug": UpdatesUtils.isNativeDebuggingEnabled()
      ]
    }

    AsyncFunction("reload") { (promise: Promise) in
      let config = AppController.sharedInstance.config
      guard config.isEnabled else {
        throw UpdatesDisabledException()
      }
      guard AppController.sharedInstance.isStarted else {
        throw UpdatesNotInitializedException()
      }
      AppController.sharedInstance.requestRelaunch { success in
        if success {
          promise.resolve(nil)
        } else {
          promise.reject(UpdatesReloadException())
        }
      }
    }

    AsyncFunction("checkForUpdateAsync") { (promise: Promise) in
      UpdatesUtils.checkForUpdate { result in
        if result["message"] != nil {
          guard let message = result["message"] as? String else {
            promise.reject("ERR_UPDATES_CHECK", "")
            return
          }
          promise.reject("ERR_UPDATES_CHECK", message)
          return
        }
        if result["manifest"] != nil {
          promise.resolve([
            "isAvailable": true,
            "manifest": result["manifest"],
            "isRollBackToEmbedded": false
          ])
          return
        }
        if result["isRollBackToEmbedded"] != nil {
          promise.resolve([
            "isAvailable": false,
            "isRollBackToEmbedded": result["isRollBackToEmbedded"]
          ])
          return
        }
        if result["reason"] != nil {
          promise.resolve([
            "isAvailable": false,
            "isRollBackToEmbedded": false,
            "reason": result["reason"]
          ])
          return
        }
        promise.resolve([
          "isAvailable": false,
          "isRollBackToEmbedded": false
        ])
      }
    }

    AsyncFunction("getExtraParamsAsync") { (promise: Promise) in
      let config = AppController.sharedInstance.config
      guard config.isEnabled else {
        throw UpdatesDisabledException()
      }

      guard let scopeKey = config.scopeKey else {
        throw Exception(name: "ERR_UPDATES_SCOPE_KEY", description: "Muse have scopeKey in config")
      }

      AppController.sharedInstance.database.databaseQueue.async {
        do {
          promise.resolve(try AppController.sharedInstance.database.extraParams(withScopeKey: scopeKey))
        } catch {
          promise.reject(error)
        }
      }
    }

    AsyncFunction("setExtraParamAsync") { (key: String, value: String?, promise: Promise) in
      let config = AppController.sharedInstance.config
      guard config.isEnabled else {
        throw UpdatesDisabledException()
      }

      guard let scopeKey = config.scopeKey else {
        throw Exception(name: "ERR_UPDATES_SCOPE_KEY", description: "Muse have scopeKey in config")
      }

      AppController.sharedInstance.database.databaseQueue.async {
        do {
          try AppController.sharedInstance.database.setExtraParam(key: key, value: value, withScopeKey: scopeKey)
          promise.resolve(nil)
        } catch {
          promise.reject(error)
        }
      }
    }

    AsyncFunction("readLogEntriesAsync") { (maxAge: Int) -> [[String: Any]] in
      // maxAge is in milliseconds, convert to seconds
      do {
        return try UpdatesLogReader().getLogEntries(newerThan: Date(timeIntervalSinceNow: TimeInterval(-1 * (maxAge / 1000))))
      } catch {
        throw Exception(name: "ERR_UPDATES_READ_LOGS", description: error.localizedDescription)
      }
    }

    AsyncFunction("clearLogEntriesAsync") { (promise: Promise) in
      UpdatesLogReader().purgeLogEntries(olderThan: Date()) { error in
        guard let error = error else {
          promise.resolve(nil)
          return
        }
        promise.reject("ERR_UPDATES_READ_LOGS", error.localizedDescription)
      }
    }

    AsyncFunction("fetchUpdateAsync") { (promise: Promise) in
      UpdatesUtils.fetchUpdate { result in
        if result["message"] != nil {
          guard let message = result["message"] as? String else {
            promise.reject("ERR_UPDATES_FETCH", "")
            return
          }
          promise.reject("ERR_UPDATES_FETCH", message)
          return
        } else {
          promise.resolve(result)
        }
      }
    }

    // Getter used internally by useUpdates()
    // to initialize its state
    AsyncFunction("getNativeStateMachineContextAsync") { (promise: Promise) in
      UpdatesUtils.getNativeStateMachineContextJson { result in
        if result["message"] != nil {
          guard let message = result["message"] as? String else {
            promise.reject("ERR_UPDATES_CHECK", "")
            return
          }
          promise.reject("ERR_UPDATES_CHECK", message)
          return
        } else {
          promise.resolve(result)
        }
      }
    }
  }
  // swiftlint:enable cyclomatic_complexity
}

// swiftlint:enable closure_body_length
// swiftlint:enable superfluous_else
