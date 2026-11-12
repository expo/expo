// Copyright 2019 650 Industries. All rights reserved.

import EXUpdatesInterface
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
public final class UpdatesModule: Module, UpdatesEventManagerObserver {
  private lazy var logEntryForwarder = UpdatesLogEntryForwarder { [weak self] entry in
    self?.sendEvent(EXUpdatesLogEntryEventName, entry)
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoUpdates")

    Events(
      EXUpdatesStateChangeEventName,
      EXUpdatesLogEntryEventName
    )

    Constants {
      AppController.sharedInstance.getConstantsForModule().toModuleConstantsMap()
    }

    OnStartObserving(EXUpdatesStateChangeEventName) {
      AppController.setUpdatesEventManagerObserver(self)
    }

    OnStopObserving(EXUpdatesStateChangeEventName) {
      AppController.removeUpdatesEventManagerObserver()
    }

    OnStartObserving(EXUpdatesLogEntryEventName) {
      self.logEntryForwarder.setEnabled(true)
    }

    OnStopObserving(EXUpdatesLogEntryEventName) {
      self.logEntryForwarder.setEnabled(false)
    }

    OnDestroy {
      AppController.removeUpdatesEventManagerObserver()
      self.logEntryForwarder.setEnabled(false)
    }

    AsyncFunction("reload") { (options: ReloadScreenOptions?, promise: Promise) in
      AppController.sharedInstance.reloadScreenManager?.setConfiguration(options)
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
            "reason": reason.rawValue
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
          promise.reject(CheckForUpdateException(error))
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
        return try UpdatesLogReader().getLogEntries(newerThan: Date(timeIntervalSinceNow: -TimeInterval(maxAge) / 1000))
      } catch {
        throw ReadLogEntriesException(error)
      }
    }

    AsyncFunction("clearLogEntriesAsync") { (promise: Promise) in
      UpdatesLogReader().clearLogEntries { error in
        guard let error = error else {
          promise.resolve(nil)
          return
        }
        promise.reject(ClearLogEntriesException(error))
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
          promise.reject(FetchUpdateException(error))
          return
        }
      } error: { error in
        promise.reject(error)
      }
    }

    Function("setUpdateURLAndRequestHeadersOverride") { (configOverride: UpdatesConfigOverrideParam?) in
      try AppController.sharedInstance.setUpdateURLAndRequestHeadersOverride(configOverride?.toUpdatesConfigOverride())
    }

    Function("setUpdateRequestHeadersOverride") { (requestHeaders: [String: String]?) in
      try AppController.sharedInstance.setUpdateRequestHeadersOverride(requestHeaders)
    }

    AsyncFunction("showReloadScreen") { (options: ReloadScreenOptions?) in
#if DEBUG
      if let reloadScreenManager = AppController.sharedInstance.reloadScreenManager {
        reloadScreenManager.setConfiguration(options)
        reloadScreenManager.show()
      }
#endif
    }.runOnQueue(.main)

    AsyncFunction("hideReloadScreen") {
#if DEBUG
      if let reloadScreenManager = AppController.sharedInstance.reloadScreenManager {
        reloadScreenManager.hide()
      }
#endif
    }.runOnQueue(.main)
  }

  public func onStateMachineContextEvent(context: UpdatesStateContext) {
    sendEvent(EXUpdatesStateChangeEventName, [
      "context": context.json
    ])
  }

  internal struct UpdatesConfigOverrideParam: Record {
    @Field var updateUrl: URL?
    @Field var requestHeaders: [String: String]

    func toUpdatesConfigOverride() -> UpdatesConfigOverride {
      return UpdatesConfigOverride(
        updateUrl: updateUrl,
        requestHeaders: requestHeaders
      )
    }
  }
}

/// Sends the log entries from `UpdatesLogEntryListenerRegistry` to `send` while it is enabled.
/// `UpdatesModule` enables it while JS listens for log entries.
internal final class UpdatesLogEntryForwarder: UpdatesLogEntryListener {
  private let send: ([String: Any]) -> Void

  init(send: @escaping ([String: Any]) -> Void) {
    self.send = send
  }

  func setEnabled(_ enabled: Bool) {
    if enabled {
      UpdatesLogEntryListenerRegistry.sharedInstance.add(self)
    } else {
      UpdatesLogEntryListenerRegistry.sharedInstance.remove(self)
    }
  }

  func updatesLogEntryWasLogged(_ entry: [String: Any]) {
    send(entry)
  }
}
