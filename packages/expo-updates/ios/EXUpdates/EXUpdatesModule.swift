// Copyright 2019 650 Industries. All rights reserved.

// swiftlint:disable closure_body_length
// swiftlint:disable function_body_length

import ExpoModulesCore

/**
 * Exported module which provides to the JS runtime information about the currently running update
 * and updates state, along with methods to check for and download new updates, reload with the
 * newest downloaded update applied, and read/clear native log entries.
 *
 * Communicates with the updates hub (EXUpdatesAppController in most apps, EXAppLoaderExpoUpdates in
 * Expo Go and legacy standalone apps) via EXUpdatesService, an internal module which is overridden
 * by EXUpdatesBinding, a scoped module, in Expo Go.
 */
public class EXUpdatesModule: Module {
  private let updatesService: EXUpdatesModuleInterface?
  private let methodQueue = DispatchQueue(label: "expo.modules.EXUpdatesQueue")

  public required init(appContext: AppContext) {
    updatesService = appContext.legacyModule(implementing: EXUpdatesModuleInterface.self)
    super.init(appContext: appContext)
  }

  public func definition() -> ModuleDefinition {
    Name("EXUpdates")

    Constants {
      let releaseChannel = updatesService?.config.releaseChannel
      let channel = updatesService?.config.requestHeaders["expo-channel-name"] ?? ""
      let runtimeVersion = updatesService?.config.runtimeVersion ?? ""
      let isMissingRuntimeVersion = updatesService?.config.isMissingRuntimeVersion()

      guard let updatesService = updatesService,
        updatesService.isStarted,
        let launchedUpdate = updatesService.launchedUpdate else {
        return [
          "isEnabled": false,
          "isEmbeddedLaunch": false,
          "isMissingRuntimeVersion": isMissingRuntimeVersion,
          "releaseChannel": releaseChannel,
          "runtimeVersion": runtimeVersion,
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
        "channel": channel,
        "commitTime": commitTime,
        "nativeDebug": EXUpdatesUtils.isNativeDebuggingEnabled()
      ]
    }

    AsyncFunction("reloadAsync") { (promise: Promise) in
      guard let updatesService = updatesService, updatesService.config.isEnabled else {
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
      guard let updatesService = updatesService, updatesService.config.isEnabled else {
        throw UpdatesDisabledException()
      }
      guard updatesService.isStarted else {
        throw UpdatesNotInitializedException()
      }

      var extraHeaders: [String: Any] = [:]
      updatesService.database.databaseQueue.sync {
        extraHeaders = EXUpdatesFileDownloader.extraHeaders(
          withDatabase: updatesService.database,
          config: updatesService.config,
          launchedUpdate: updatesService.launchedUpdate,
          embeddedUpdate: updatesService.embeddedUpdate
        )
      }

      let fileDownloader = EXUpdatesFileDownloader(config: updatesService.config)
      fileDownloader.downloadManifest(
        // swiftlint:disable:next force_unwrapping
        fromURL: updatesService.config.updateUrl!,
        withDatabase: updatesService.database,
        extraHeaders: extraHeaders
      ) { update in
        let launchedUpdate = updatesService.launchedUpdate
        let selectionPolicy = updatesService.selectionPolicy
        if selectionPolicy.shouldLoadNewUpdate(update, withLaunchedUpdate: launchedUpdate, filters: update.manifestFilters) {
          promise.resolve([
            "isAvailable": true,
            "manifest": update.manifest.rawManifestJSON()
          ])
        }
      } errorBlock: { error in
        promise.reject("ERR_UPDATES_CHECK", error.localizedDescription)
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
      guard let updatesService = updatesService, updatesService.config.isEnabled else {
        throw UpdatesDisabledException()
      }
      guard updatesService.isStarted else {
        throw UpdatesNotInitializedException()
      }

      let remoteAppLoader = EXUpdatesRemoteAppLoader(
        config: updatesService.config,
        database: updatesService.database,
        directory: updatesService.directory,
        launchedUpdate: updatesService.launchedUpdate,
        completionQueue: methodQueue
      )
      remoteAppLoader.loadUpdate(
        // swiftlint:disable:next force_unwrapping
        fromURL: updatesService.config.updateUrl!
      ) { update in
        return updatesService.selectionPolicy.shouldLoadNewUpdate(
          update,
          withLaunchedUpdate: updatesService.launchedUpdate,
          filters: update.manifestFilters
        )
      } asset: { _, _, _, _ in
        // do nothing for now
      } success: { update in
        if let update = update {
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
      } error: { error in
        promise.reject("ERR_UPDATES_FETCH", "Failed to download new update: \(error.localizedDescription)")
      }
    }
  }
}
