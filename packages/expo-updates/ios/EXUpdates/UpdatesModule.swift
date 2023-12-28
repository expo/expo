// Copyright 2019 650 Industries. All rights reserved.

// swiftlint:disable closure_body_length

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
  public func definition() -> ModuleDefinition {
    Name("ExpoUpdates")

    Constants {
      let constantsForModule = AppController.sharedInstance.getConstantsForModule()

      let releaseChannel = constantsForModule.releaseChannel
      let channel = constantsForModule.requestHeaders["expo-channel-name"] ?? ""
      let runtimeVersion = constantsForModule.runtimeVersion ?? ""
      let checkAutomatically = constantsForModule.checkOnLaunch.asString
      let isMissingRuntimeVersion = constantsForModule.isMissingRuntimeVersion

      guard AppController.sharedInstance.isStarted,
        let launchedUpdate = constantsForModule.launchedUpdate else {
        return [
          "isEnabled": false,
          "isEmbeddedLaunch": false,
          "isMissingRuntimeVersion": isMissingRuntimeVersion,
          "releaseChannel": releaseChannel,
          "runtimeVersion": runtimeVersion,
          "checkAutomatically": checkAutomatically,
          "channel": channel,
          "shouldDeferToNativeForAPIMethodAvailabilityInDevelopment":
            constantsForModule.shouldDeferToNativeForAPIMethodAvailabilityInDevelopment || UpdatesUtils.isNativeDebuggingEnabled()
        ]
      }

      let embeddedUpdate = constantsForModule.embeddedUpdate
      let isEmbeddedLaunch = embeddedUpdate != nil && embeddedUpdate?.updateId == launchedUpdate.updateId

      let commitTime = UInt64(floor(launchedUpdate.commitTime.timeIntervalSince1970 * 1000))
      return [
        "isEnabled": true,
        "isEmbeddedLaunch": isEmbeddedLaunch,
        "isUsingEmbeddedAssets": constantsForModule.isUsingEmbeddedAssets,
        "updateId": launchedUpdate.updateId.uuidString,
        "manifest": launchedUpdate.manifest.rawManifestJSON(),
        "localAssets": constantsForModule.assetFilesMap,
        "isEmergencyLaunch": constantsForModule.isEmergencyLaunch,
        "isMissingRuntimeVersion": isMissingRuntimeVersion,
        "releaseChannel": releaseChannel,
        "runtimeVersion": runtimeVersion,
        "checkAutomatically": checkAutomatically,
        "channel": channel,
        "commitTime": commitTime,
        "shouldDeferToNativeForAPIMethodAvailabilityInDevelopment":
          constantsForModule.shouldDeferToNativeForAPIMethodAvailabilityInDevelopment || UpdatesUtils.isNativeDebuggingEnabled()
      ]
    }

    AsyncFunction("reload") { (promise: Promise) in
      AppController.sharedInstance.requestRelaunch {
        promise.resolve(nil)
      } error: { error in
        promise.reject(error)
      }
    }

    AsyncFunction("checkForUpdateAsync") { (promise: Promise) in
      AppController.sharedInstance.checkForUpdate { checkForUpdateResult in
        switch checkForUpdateResult {
        case .noUpdateAvailable(let reason):
          promise.resolve([
            "isAvailable": false,
            "isRollBackToEmbedded": false,
            "reason": reason
          ])
          return
        case .updateAvailable(let manifest):
          promise.resolve([
            "isAvailable": true,
            "manifest": manifest,
            "isRollBackToEmbedded": false
          ])
          return
        case .rollBackToEmbedded:
          promise.resolve([
            "isAvailable": false,
            "isRollBackToEmbedded": true
          ])
          return
        case .error(let error):
          promise.reject("ERR_UPDATES_CHECK", error.localizedDescription)
          return
        }
      } error: { error in
        promise.reject(error)
      }
    }

    AsyncFunction("getExtraParamsAsync") { (promise: Promise) in
      AppController.sharedInstance.getExtraParams { extraParams in
        promise.resolve(extraParams)
      } error: { error in
        promise.reject(error)
      }
    }

    AsyncFunction("setExtraParamAsync") { (key: String, value: String?, promise: Promise) in
      AppController.sharedInstance.setExtraParam(key: key, value: value) {
        promise.resolve(nil)
      } error: { error in
        promise.reject(error)
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
      AppController.sharedInstance.fetchUpdate { fetchUpdateResult in
        switch fetchUpdateResult {
        case .success(let manifest):
          promise.resolve([
            "isNew": true,
            "isRollBackToEmbedded": false,
            "manifest": manifest
          ])
          return
        case .failure:
          promise.resolve([
            "isNew": false,
            "isRollBackToEmbedded": false
          ])
          return
        case .rollBackToEmbedded:
          promise.resolve([
            "isNew": false,
            "isRollBackToEmbedded": true
          ])
          return
        case .error(let error):
          promise.reject("ERR_UPDATES_FETCH", error.localizedDescription)
          return
        }
      } error: { error in
        promise.reject(error)
      }
    }

    // Getter used internally by useUpdates()
    // to initialize its state
    AsyncFunction("getNativeStateMachineContextAsync") { (promise: Promise) in
      AppController.sharedInstance.getNativeStateMachineContext { stateMachineContext in
        promise.resolve(stateMachineContext.json)
      } error: { error in
        promise.reject(error)
      }
    }
  }
}

// swiftlint:enable closure_body_length
