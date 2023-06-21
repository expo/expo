// Copyright 2019 650 Industries. All rights reserved.

// swiftlint:disable closure_body_length
// swiftlint:disable function_body_length
// swiftlint:disable type_body_length

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
  private let methodQueue = DispatchQueue(label: "expo.modules.EXUpdatesQueue")

  public required init(appContext: AppContext) {
    updatesService = appContext.legacyModule(implementing: EXUpdatesModuleInterface.self)
    // Ensures the universal UpdatesConfig can cast to versioned UpdatesConfig without exception in Swift
    object_setClass(updatesService?.config, UpdatesConfig.self)
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
        "manifest": launchedUpdate.manifest.rawManifestJSON(),
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
      guard let updatesService = updatesService,
        let config = updatesService.config,
        let selectionPolicy = updatesService.selectionPolicy,
        config.isEnabled else {
        throw UpdatesDisabledException()
      }
      guard updatesService.isStarted else {
        throw UpdatesNotInitializedException()
      }

      var extraHeaders: [String: Any] = [:]
      updatesService.database.databaseQueue.sync {
        extraHeaders = FileDownloader.extraHeadersForRemoteUpdateRequest(
          withDatabase: updatesService.database,
          config: config,
          launchedUpdate: updatesService.launchedUpdate,
          embeddedUpdate: updatesService.embeddedUpdate
        )
      }

      let fileDownloader = FileDownloader(config: config)
      fileDownloader.downloadRemoteUpdate(
        // swiftlint:disable:next force_unwrapping
        fromURL: config.updateUrl!,
        withDatabase: updatesService.database,
        extraHeaders: extraHeaders
      ) { updateResponse in
        guard let update = updateResponse.manifestUpdateResponsePart?.updateManifest else {
          promise.resolve([
            "isAvailable": false
          ])
          return
        }

        let launchedUpdate = updatesService.launchedUpdate
        if selectionPolicy.shouldLoadNewUpdate(update, withLaunchedUpdate: launchedUpdate, filters: updateResponse.responseHeaderData?.manifestFilters) {
          promise.resolve([
            "isAvailable": true,
            "manifest": update.manifest.rawManifestJSON()
          ])
        } else {
          promise.resolve([
            "isAvailable": false
          ])
        }
      } errorBlock: { error in
        promise.reject("ERR_UPDATES_CHECK", error.localizedDescription)
      }
    }

    AsyncFunction("getExtraClientParamsAsync") { (promise: Promise) in
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
      guard let updatesService = updatesService,
        let config = updatesService.config,
        let selectionPolicy = updatesService.selectionPolicy,
        config.isEnabled else {
        throw UpdatesDisabledException()
      }
      guard updatesService.isStarted else {
        throw UpdatesNotInitializedException()
      }

      let remoteAppLoader = RemoteAppLoader(
        config: config,
        database: updatesService.database,
        directory: updatesService.directory,
        launchedUpdate: updatesService.launchedUpdate,
        completionQueue: methodQueue
      )
      remoteAppLoader.loadUpdate(
        // swiftlint:disable:next force_unwrapping
        fromURL: config.updateUrl!
      ) { updateResponse in
        if let updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective {
          switch updateDirective {
          case is NoUpdateAvailableUpdateDirective:
            return false
          case is RollBackToEmbeddedUpdateDirective:
            return true
          default:
            NSException(name: .internalInconsistencyException, reason: "Unhandled update directive type").raise()
            return false
          }
        }

        guard let update = updateResponse.manifestUpdateResponsePart?.updateManifest else {
          return false
        }

        return selectionPolicy.shouldLoadNewUpdate(
          update,
          withLaunchedUpdate: updatesService.launchedUpdate,
          filters: updateResponse.responseHeaderData?.manifestFilters
        )
      } asset: { _, _, _, _ in
        // do nothing for now
      } success: { updateResponse in
        if updateResponse?.directiveUpdateResponsePart?.updateDirective is RollBackToEmbeddedUpdateDirective {
          promise.resolve([
            "isRollBackToEmbedded": true
          ])
        } else {
          if let update = updateResponse?.manifestUpdateResponsePart?.updateManifest {
            updatesService.resetSelectionPolicy()
            promise.resolve([
              "isNew": true,
              "manifest": update.manifest.rawManifestJSON()
            ])
          } else {
            promise.resolve([
              "isNew": false
            ])
          }
        }
      } error: { error in
        promise.reject("ERR_UPDATES_FETCH", "Failed to download new update: \(error.localizedDescription)")
      }
    }
  }
}
