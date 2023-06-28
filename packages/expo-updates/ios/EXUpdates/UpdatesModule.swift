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
  private let updatesService: EXUpdatesModuleInterface?
  private let methodQueue = UpdatesUtils.methodQueue

  public required init(appContext: AppContext) {
    updatesService = appContext.legacyModule(implementing: EXUpdatesModuleInterface.self)
    super.init(appContext: appContext)
  }

  // swiftlint:disable cyclomatic_complexity
  public func definition() -> ModuleDefinition {
    Name("ExpoUpdates")

    Constants {
      let releaseChannel = updatesService?.config?.releaseChannel
      let channel = updatesService?.config?.requestHeaders["expo-channel-name"] ?? ""
      let runtimeVersion = updatesService?.config?.runtimeVersion ?? ""
      let checkAutomatically = updatesService?.config?.checkOnLaunch.asString ?? CheckAutomaticallyConfig.Always.asString
      let isMissingRuntimeVersion = updatesService?.config?.isMissingRuntimeVersion()

      guard let updatesService = updatesService,
        updatesService.isStarted,
        let launchedUpdate = updatesService.launchedUpdate else {
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

      let commitTime = UInt64(floor(launchedUpdate.commitTime.timeIntervalSince1970 * 1000))
      return [
        "isEnabled": true,
        "isEmbeddedLaunch": updatesService.isEmbeddedLaunch,
        "isUsingEmbeddedAssets": updatesService.isUsingEmbeddedAssets,
        "updateId": launchedUpdate.updateId.uuidString,
        "manifest": launchedUpdate.manifest?.rawManifestJSON() ?? [:],
        "localAssets": updatesService.assetFilesMap ?? [:],
        "isEmergencyLaunch": updatesService.isEmergencyLaunch,
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
      guard let updatesService = updatesService, let config = updatesService.config, config.isEnabled else {
        throw UpdatesDisabledException()
      }
      guard updatesService.canRelaunch else {
        throw UpdatesNotInitializedException()
      }
      updatesService.requestRelaunch { success in
        if success {
          promise.resolve(nil)
        } else {
          promise.reject(UpdatesReloadException())
        }
      }
    }

    AsyncFunction("checkForUpdateAsync") { (promise: Promise) in
      let maybeIsCheckForUpdateEnabled: Bool? = updatesService?.canCheckForUpdateAndFetchUpdate ?? true
      guard maybeIsCheckForUpdateEnabled ?? false else {
        promise.reject("ERR_UPDATES_CHECK", "checkForUpdateAsync() is not enabled")
        return
      }
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
        promise.resolve(["isAvailable": false, "isRollBackToEmbedded": false])
      }
    }

    AsyncFunction("getExtraParamsAsync") { (promise: Promise) in
      guard let updatesService = updatesService,
        let config = updatesService.config,
        config.isEnabled else {
        throw UpdatesDisabledException()
      }

      guard let scopeKey = config.scopeKey else {
        throw Exception(name: "ERR_UPDATES_SCOPE_KEY", description: "Muse have scopeKey in config")
      }

      updatesService.database.databaseQueue.async {
        do {
          promise.resolve(try updatesService.database.extraParams(withScopeKey: scopeKey))
        } catch {
          promise.reject(error)
        }
      }
    }

    AsyncFunction("setExtraParamAsync") { (key: String, value: String?, promise: Promise) in
      guard let updatesService = updatesService,
        let config = updatesService.config,
        config.isEnabled else {
        throw UpdatesDisabledException()
      }

      guard let scopeKey = config.scopeKey else {
        throw Exception(name: "ERR_UPDATES_SCOPE_KEY", description: "Muse have scopeKey in config")
      }

      updatesService.database.databaseQueue.async {
        do {
          try updatesService.database.setExtraParam(key: key, value: value, withScopeKey: scopeKey)
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
      let maybeIsCheckForUpdateEnabled: Bool? = updatesService?.canCheckForUpdateAndFetchUpdate ?? true
      guard maybeIsCheckForUpdateEnabled ?? false else {
        promise.reject("ERR_UPDATES_FETCH", "fetchUpdateAsync() is not enabled")
        return
      }
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
  }
  // swiftlint:enable cyclomatic_complexity
}

// swiftlint:enable closure_body_length
// swiftlint:enable superfluous_else
