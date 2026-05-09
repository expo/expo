// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore
import EXManifests
import EXUpdates

/**
 Drop-in replacement for the expo-updates UpdatesModule for use in Expo Go that is mostly just a stub
 but does expose some information about the currently-running update.

 Updates don't really make sense in Expo Go (can't recieve, fetch, install, etc), but sometimes
 it is helpful to be able to access the module's constants about the currently-running update.

 This API should be kept in-sync with UpdatesModule.
 */
final class ExpoGoExpoUpdatesModule: Module {
  private let scopeKey: String
  private let updatesKernelService: UpdatesBindingDelegate
  private let manifest: Manifest

  // swiftlint:disable:next unavailable_function
  required init(appContext: AppContext) {
    fatalError("Initializer not implemented, use init(appContext:updatesKernelService:scopeKey:manifest:) instead")
  }

  required init(appContext: AppContext, updatesKernelService: UpdatesBindingDelegate, scopeKey: String, manifest: Manifest) {
    self.updatesKernelService = updatesKernelService
    self.scopeKey = scopeKey
    self.manifest = manifest

    super.init(appContext: appContext)
  }

  func definition() -> ModuleDefinition {
    Name("ExpoUpdates")

    Constants {
      let config = updatesKernelService.configForScopeKey(scopeKey)
      // Use the launcher's update if available, otherwise construct the
      // manifest constants directly from the manifest that was passed at
      // construction time. This avoids a race where the JS bridge evaluates
      // module constants before the app launcher has finished initializing.
      let launchedUpdate = updatesKernelService.launchedUpdateForScopeKey(scopeKey)
      var constants = UpdatesModuleConstants(
        launchedUpdate: launchedUpdate,
        launchDuration: updatesKernelService.launchDurationForScopeKey(scopeKey)?.doubleValue,
        embeddedUpdate: nil,
        emergencyLaunchException: nil,
        isEnabled: true,
        isUsingEmbeddedAssets: false,
        runtimeVersion: config?.runtimeVersion ?? "",
        checkOnLaunch: config?.checkOnLaunch ?? CheckAutomaticallyConfig.Always,
        requestHeaders: config?.requestHeaders ?? [:],
        assetFilesMap: updatesKernelService.assetFilesMapForScopeKey(scopeKey),
        shouldDeferToNativeForAPIMethodAvailabilityInDevelopment: true,
        initialContext: UpdatesStateContext()
      ).toModuleConstantsMap()

      if launchedUpdate == nil {
        if let expoUpdatesManifest = manifest as? ExpoUpdatesManifest {
          constants["updateId"] = expoUpdatesManifest.rawId()
          constants["commitTime"] = expoUpdatesManifest.createdAt()
        }
        constants["manifest"] = manifest.rawManifestJSON()
      }

      return constants
    }

    AsyncFunction("reload") { (promise: Promise) in
      guard let config = updatesKernelService.configForScopeKey(scopeKey) else {
        throw UpdatesDisabledException("Updates.reloadAsync()")
      }

      updatesKernelService.requestRelaunchForScopeKey(scopeKey) { success in
        if success {
          promise.resolve(nil)
        } else {
          promise.reject(UpdatesReloadException())
        }
      }
    }

    AsyncFunction("checkForUpdateAsync") { (promise: Promise) in
      promise.reject(
        "ERR_NOT_SUPPORTED",
        "checkForUpdateAsync() is not accessible in Expo Go. A non-development build should be used to test this functionality."
      )
    }

    AsyncFunction("getExtraParamsAsync") { (promise: Promise) in
      promise.reject(
        "ERR_NOT_SUPPORTED",
        "getExtraParamsAsync() is not accessible in Expo Go. A non-development build should be used to test this functionality."
      )
    }

    AsyncFunction("setExtraParamAsync") { (_: String, _: String?, promise: Promise) in
      promise.reject(
        "ERR_NOT_SUPPORTED",
        "getExtraParamsAsync() is not accessible in Expo Go. A non-development build should be used to test this functionality."
      )
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
      promise.reject(
        "ERR_NOT_SUPPORTED",
        "fetchUpdateAsync() is not accessible in Expo Go. A non-development build should be used to test this functionality."
      )
    }
  }
}
