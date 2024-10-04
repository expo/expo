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

      let embeddedUpdate = AppController.sharedInstance.getEmbeddedUpdate()
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
      let config = AppController.sharedInstance.config
      guard config.isEnabled else {
        throw UpdatesDisabledException()
      }
      guard AppController.sharedInstance.isStarted else {
        throw UpdatesNotInitializedException()
      }

      AppController.sharedInstance.checkForUpdate { remoteCheckResult in
        switch remoteCheckResult {
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
      }
    }

    AsyncFunction("getExtraParamsAsync") { (promise: Promise) in
      let config = AppController.sharedInstance.config
      guard config.isEnabled else {
        throw UpdatesDisabledException()
      }
      guard AppController.sharedInstance.isStarted else {
        throw UpdatesNotInitializedException()
      }

      AppController.sharedInstance.getExtraParams { extraParams in
        promise.resolve(extraParams)
      } error: { error in
        promise.reject(error)
      }
    }

    AsyncFunction("setExtraParamAsync") { (key: String, value: String?, promise: Promise) in
      let config = AppController.sharedInstance.config
      guard config.isEnabled else {
        throw UpdatesDisabledException()
      }
      guard AppController.sharedInstance.isStarted else {
        throw UpdatesNotInitializedException()
      }

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
      let config = AppController.sharedInstance.config
      guard config.isEnabled else {
        throw UpdatesDisabledException()
      }
      guard AppController.sharedInstance.isStarted else {
        throw UpdatesNotInitializedException()
      }

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
      }
    }

    // Getter used internally by useUpdates()
    // to initialize its state
    AsyncFunction("getNativeStateMachineContextAsync") { (promise: Promise) in
      let config = AppController.sharedInstance.config
      guard config.isEnabled else {
        throw UpdatesDisabledException()
      }
      guard AppController.sharedInstance.isStarted else {
        throw UpdatesNotInitializedException()
      }

      AppController.sharedInstance.getNativeStateMachineContext { stateMachineContext in
        promise.resolve(stateMachineContext.json)
      }
    }
  }
  // swiftlint:enable cyclomatic_complexity
}

// swiftlint:enable closure_body_length
// swiftlint:enable superfluous_else
