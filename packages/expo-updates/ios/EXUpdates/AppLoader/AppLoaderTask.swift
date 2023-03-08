//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable closure_body_length
// swiftlint:disable type_body_length
// swiftlint:disable file_length

// this class uses a ton of implicit non-null properties based on method call order. not worth changing to appease lint
// swiftlint:disable force_unwrapping

import Foundation

@objc(EXUpdatesAppLoaderTaskDelegate)
public protocol AppLoaderTaskDelegate: AnyObject {
  /**
   * This method gives the delegate a backdoor option to ignore the cached update and force
   * a remote load if it decides the cached update is not runnable. Returning NO from this
   * callback will force a remote load, overriding the timeout and configuration settings for
   * whether or not to check for a remote update. Returning YES from this callback will make
   * EXUpdatesAppLoaderTask proceed as usual.
   */
  func appLoaderTask(_: AppLoaderTask, didLoadCachedUpdate update: Update) -> Bool
  func appLoaderTask(_: AppLoaderTask, didStartLoadingUpdate update: Update)
  func appLoaderTask(_: AppLoaderTask, didFinishWithLauncher launcher: AppLauncher, isUpToDate: Bool)
  func appLoaderTask(_: AppLoaderTask, didFinishWithError error: Error)
  func appLoaderTask(
    _: AppLoaderTask,
    didFinishBackgroundUpdateWithStatus status: BackgroundUpdateStatus,
    update: Update?,
    error: Error?
  )
}

@objc(EXUpdatesBackgroundUpdateStatus)
public enum BackgroundUpdateStatus: Int {
  case error = 0
  case noUpdateAvailable = 1
  case updateAvailable = 2
}

/**
 * Controlling class that handles the complex logic that needs to happen each time the app is cold
 * booted. From a high level, this class does the following:
 *
 * - Immediately starts an instance of EXUpdatesEmbeddedAppLoader to load the embedded update into
 *   SQLite. This does nothing if SQLite already has the embedded update or a newer one, but we have
 *   to do this on each cold boot, as we have no way of knowing if a new build was just installed
 *   (which could have a new embedded update).
 * - If the app is configured for automatic update downloads (most apps), starts a timer based on
 *   the `launchWaitMs` value in EXUpdatesConfig.
 * - Again if the app is configured for automatic update downloads, starts an instance of
 *   EXUpdatesRemoteAppLoader to check for and download a new update if there is one.
 * - Once the download succeeds, fails, or the timer runs out (whichever happens first), creates an
 *   instance of EXUpdatesAppLauncherWithDatabase and signals that the app is ready to be launched
 *   with the newest update available locally at that time (which may not be the newest update if
 *   the download is still in progress).
 * - If the download succeeds or fails after this point, fires a callback which causes an event to
 *   be sent to JS.
 */
@objc(EXUpdatesAppLoaderTask)
@objcMembers
public final class AppLoaderTask: NSObject {
  private static let ErrorDomain = "EXUpdatesAppLoaderTask"

  public weak var delegate: AppLoaderTaskDelegate?

  private let config: UpdatesConfig
  private let database: UpdatesDatabase
  private let directory: URL
  private let selectionPolicy: SelectionPolicy
  private let delegateQueue: DispatchQueue

  private var candidateLauncher: AppLauncher?
  private var finalizedLauncher: AppLauncher?
  private var embeddedAppLoader: EmbeddedAppLoader?
  private var remoteAppLoader: RemoteAppLoader?
  private let logger: UpdatesLogger

  private var timer: Timer?
  public private(set) var isRunning: Bool
  private var isReadyToLaunch: Bool
  private var isTimerFinished: Bool
  private var hasLaunched: Bool
  private var isUpToDate: Bool
  private let loaderTaskQueue: DispatchQueue

  public required init(
    withConfig config: UpdatesConfig,
    database: UpdatesDatabase,
    directory: URL,
    selectionPolicy: SelectionPolicy,
    delegateQueue: DispatchQueue
  ) {
    self.config = config
    self.database = database
    self.directory = directory
    self.selectionPolicy = selectionPolicy
    self.isRunning = false
    self.isReadyToLaunch = false
    self.isTimerFinished = false
    self.hasLaunched = false
    self.isUpToDate = false
    self.delegateQueue = delegateQueue
    self.loaderTaskQueue = DispatchQueue(label: "expo.loader.LoaderTaskQueue")
    self.logger = UpdatesLogger()
  }

  public func start() {
    guard config.isEnabled else {
      // swiftlint:disable:next line_length
      let errorMessage = "EXUpdatesAppLoaderTask was passed a configuration object with updates disabled. You should load updates from an embedded source rather than calling EXUpdatesAppLoaderTask, or enable updates in the configuration."
      logger.error(message: errorMessage, code: .updateFailedToLoad)
      delegateQueue.async {
        self.delegate?.appLoaderTask(
          self,
          didFinishWithError: NSError(
            domain: AppLoaderTask.ErrorDomain,
            code: 1030,
            userInfo: [NSLocalizedDescriptionKey: errorMessage]
          )
        )
      }
      return
    }

    guard config.updateUrl != nil else {
      // swiftlint:disable:next line_length
      let errorMessage = "EXUpdatesAppLoaderTask was passed a configuration object with a null URL. You must pass a nonnull URL in order to use EXUpdatesAppLoaderTask to load updates."
      logger.error(message: errorMessage, code: .updateFailedToLoad)
      delegateQueue.async {
        self.delegate?.appLoaderTask(
          self,
          didFinishWithError: NSError(
            domain: AppLoaderTask.ErrorDomain,
            code: 1030,
            userInfo: [NSLocalizedDescriptionKey: errorMessage]
          )
        )
      }
      return
    }

    isRunning = true

    var shouldCheckForUpdate = UpdatesUtils.shouldCheckForUpdate(withConfig: config)
    let launchWaitMs = config.launchWaitMs
    if launchWaitMs == 0 || !shouldCheckForUpdate {
      isTimerFinished = true
    } else {
      let fireDate = Date(timeIntervalSinceNow: Double(launchWaitMs) / 1000)
      timer = Timer(fireAt: fireDate, interval: 0, target: self, selector: #selector(timerDidFire), userInfo: nil, repeats: false)
      RunLoop.main.add(timer!, forMode: .default)
    }

    loadEmbeddedUpdate {
      self.launch { error, success in
        if !success {
          if !shouldCheckForUpdate {
            self.finish(withError: error)
          }
          self.logger.error(
            message: "Failed to launch embedded or launchable update: \(error?.localizedDescription ?? "")",
            code: .updateFailedToLoad
          )
        } else {
          if let delegate = self.delegate,
            !delegate.appLoaderTask(self, didLoadCachedUpdate: self.candidateLauncher!.launchedUpdate!) {
            // ignore timer and other settings and force launch a remote update.
            self.candidateLauncher = nil
            self.stopTimer()
            shouldCheckForUpdate = true
          } else {
            self.isReadyToLaunch = true
            self.maybeFinish()
          }
        }

        if shouldCheckForUpdate {
          self.loadRemoteUpdate { remoteError, remoteUpdate in
            self.handleRemoteUpdateLoaded(remoteUpdate, error: remoteError)
          }
        } else {
          self.isRunning = false
          self.runReaper()
        }
      }
    }
  }

  private func finish(withError error: Error?) {
    dispatchPrecondition(condition: .onQueue(loaderTaskQueue))

    if hasLaunched {
      // we've already fired once, don't do it again
      return
    }

    hasLaunched = true
    finalizedLauncher = candidateLauncher

    if let delegate = delegate {
      delegateQueue.async {
        if self.isReadyToLaunch &&
          (self.finalizedLauncher!.launchAssetUrl != nil || self.finalizedLauncher!.launchedUpdate!.status == .StatusDevelopment) {
          delegate.appLoaderTask(self, didFinishWithLauncher: self.finalizedLauncher!, isUpToDate: self.isUpToDate)
        } else {
          delegate.appLoaderTask(
            self,
            didFinishWithError: error ?? NSError(
              domain: AppLoaderTask.ErrorDomain,
              code: 1031,
              userInfo: [
                NSLocalizedDescriptionKey: "EXUpdatesAppLoaderTask encountered an unexpected error and could not launch an update."
              ]
            )
          )
        }
      }
    }

    stopTimer()
  }

  private func maybeFinish() {
    guard isTimerFinished && isReadyToLaunch else {
      // too early, bail out
      return
    }
    finish(withError: nil)
  }

  func timerDidFire() {
    loaderTaskQueue.async {
      self.isTimerFinished = true
      self.maybeFinish()
    }
  }

  private func stopTimer() {
    timer.let { it in
      it.invalidate()
      timer = nil
    }
    isTimerFinished = true
  }

  private func runReaper() {
    if let launchedUpdate = finalizedLauncher?.launchedUpdate {
      UpdatesReaper.reapUnusedUpdates(
        withConfig: config,
        database: database,
        directory: directory,
        selectionPolicy: selectionPolicy,
        launchedUpdate: launchedUpdate
      )
    }
  }

  private func loadEmbeddedUpdate(withCompletion completion: @escaping () -> Void) {
    AppLauncherWithDatabase.launchableUpdate(
      withConfig: config,
      database: database,
      selectionPolicy: selectionPolicy,
      completionQueue: loaderTaskQueue
    ) { error, launchableUpdate in
      self.database.databaseQueue.async {
        var manifestFiltersError: Error?
        var manifestFilters: [String: Any]?
        do {
          manifestFilters = try self.database.manifestFilters(withScopeKey: self.config.scopeKey!)
        } catch {
          manifestFiltersError = error
        }

        self.loaderTaskQueue.async {
          if manifestFiltersError != nil {
            completion()
            return
          }

          if self.config.hasEmbeddedUpdate && self.selectionPolicy.shouldLoadNewUpdate(
            EmbeddedAppLoader.embeddedManifest(withConfig: self.config, database: self.database),
            withLaunchedUpdate: launchableUpdate,
            filters: manifestFilters
          ) {
            // launchedUpdate is nil because we don't yet have one, and it doesn't matter as we won't
            // be sending an HTTP request from EXUpdatesEmbeddedAppLoader
            self.embeddedAppLoader = EmbeddedAppLoader(
              config: self.config,
              database: self.database,
              directory: self.directory,
              launchedUpdate: nil,
              completionQueue: self.loaderTaskQueue
            )
            self.embeddedAppLoader!.loadUpdateFromEmbeddedManifest(
              withCallback: { _ in
                // we already checked using selection policy, so we don't need to check again
                return true
              }, asset: { _, _, _, _ in
                // do nothing for now
              }, success: { _ in
                completion()
              }, error: { _ in
                completion()
              }
            )
          } else {
            completion()
          }
        }
      }
    }
  }

  private func launch(withCompletion completion: @escaping (_ error: Error?, _ success: Bool) -> Void) {
    let launcher = AppLauncherWithDatabase(config: config, database: database, directory: directory, completionQueue: loaderTaskQueue)
    candidateLauncher = launcher
    launcher.launchUpdate(withSelectionPolicy: selectionPolicy, completion: completion)
  }

  private func loadRemoteUpdate(withCompletion completion: @escaping (_ remoteError: Error?, _ remoteUpdate: Update?) -> Void) {
    remoteAppLoader = RemoteAppLoader(
      config: config,
      database: database,
      directory: directory,
      launchedUpdate: candidateLauncher?.launchedUpdate,
      completionQueue: loaderTaskQueue
    )
    remoteAppLoader!.loadUpdate(
      fromURL: config.updateUrl!
    ) { update in
      if self.selectionPolicy.shouldLoadNewUpdate(update, withLaunchedUpdate: self.candidateLauncher?.launchedUpdate, filters: update.manifestFilters) {
        self.isUpToDate = false
        if let delegate = self.delegate {
          self.delegateQueue.async {
            delegate.appLoaderTask(self, didStartLoadingUpdate: update)
          }
        }
        return true
      } else {
        self.isUpToDate = true
        return false
      }
    } asset: { _, _, _, _ in
      // do nothing for now
    } success: { update in
      completion(nil, update)
    } error: { error in
      completion(error, nil)
    }
  }

  private func handleRemoteUpdateLoaded(_ update: Update?, error: Error?) {
    // If the app has not yet been launched (because the timer is still running),
    // create a new launcher so that we can launch with the newly downloaded update.
    // Otherwise, we've already launched. Send an event to the notify JS of the new update.

    loaderTaskQueue.async {
      self.stopTimer()

      if let update = update {
        if !self.hasLaunched {
          let newLauncher = AppLauncherWithDatabase(
            config: self.config,
            database: self.database,
            directory: self.directory,
            completionQueue: self.loaderTaskQueue
          )
          newLauncher.launchUpdate(withSelectionPolicy: self.selectionPolicy) { error, success in
            if success {
              if !self.hasLaunched {
                self.candidateLauncher = newLauncher
                self.isReadyToLaunch = true
                self.isUpToDate = true
                self.finish(withError: nil)
              }
            } else {
              self.finish(withError: error)
              NSLog("Downloaded update but failed to relaunch: %@", error?.localizedDescription ?? "")
            }
            self.isRunning = false
            self.runReaper()
          }
        } else {
          self.didFinishBackgroundUpdate(withStatus: .updateAvailable, update: update, error: nil)
          self.isRunning = false
          self.runReaper()
        }
      } else {
        // there's no update, so signal we're ready to launch
        self.finish(withError: error)
        if let error = error {
          self.didFinishBackgroundUpdate(withStatus: .error, update: nil, error: error)
        } else {
          self.didFinishBackgroundUpdate(withStatus: .noUpdateAvailable, update: nil, error: nil)
        }
        self.isRunning = false
        self.runReaper()
      }
    }
  }

  private func didFinishBackgroundUpdate(withStatus status: BackgroundUpdateStatus, update: Update?, error: Error?) {
    delegate.let { it in
      delegateQueue.async {
        it.appLoaderTask(self, didFinishBackgroundUpdateWithStatus: status, update: update, error: error)
      }
    }
  }
}
