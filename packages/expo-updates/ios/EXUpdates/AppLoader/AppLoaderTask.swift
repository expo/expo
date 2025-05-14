//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable closure_body_length
// swiftlint:disable superfluous_else
// swiftlint:disable line_length

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
   * AppLoaderTask proceed as usual.
   */
  func appLoaderTask(_: AppLoaderTask, didLoadCachedUpdate update: Update) -> Bool
  func appLoaderTask(_: AppLoaderTask, didStartLoadingUpdate update: Update?)
  func appLoaderTask(_: AppLoaderTask, didFinishWithLauncher launcher: AppLauncher, isUpToDate: Bool)
  func appLoaderTask(_: AppLoaderTask, didFinishWithError error: Error)
  func appLoaderTask(
    _: AppLoaderTask,
    didFinishBackgroundUpdateWithStatus status: BackgroundUpdateStatus,
    update: Update?,
    error: Error?
  )

  /**
   * This method is called after the loader task finishes doing all work. Note that it may have
   * "succeeded" before this with a loader, yet this method may still be called after the launch
   * to signal that all work is done (loading a remote update after the launch wait timeout has occurred).
   */
  func appLoaderTaskDidFinishAllLoading(_: AppLoaderTask)
}

public enum RemoteCheckResultNotAvailableReason: String {
  /**
   * No update manifest or rollback directive received from the update server.
   */
  case noUpdateAvailableOnServer
  /**
   * An update manifest was received from the update server, but the update is not
   * launchable, or does not pass the configured selection policy.
   */
  case updateRejectedBySelectionPolicy
  /**
   * An update manifest was received from the update server, but the update has been
   * previously launched on this device and never successfully launched.
   */
  case updatePreviouslyFailed
  /**
   * A rollback directive was received from the update server, but the directive
   * does not pass the configured selection policy.
   */
  case rollbackRejectedBySelectionPolicy
  /**
   * A rollback directive was received from the update server, but this app has no embedded update.
   */
  case rollbackNoEmbedded
}

public enum RemoteCheckResult {
  case noUpdateAvailable(reason: RemoteCheckResultNotAvailableReason)
  case updateAvailable(manifest: [String: Any])
  case rollBackToEmbedded(commitTime: Date)
}

public protocol AppLoaderTaskSwiftDelegate: AnyObject {
  func appLoaderTaskDidStartCheckingForRemoteUpdate(_: AppLoaderTask)
  func appLoaderTask(_: AppLoaderTask, didFinishCheckingForRemoteUpdateWithRemoteCheckResult remoteCheckResult: RemoteCheckResult)
  func appLoaderTask(_: AppLoaderTask, didLoadAsset asset: UpdateAsset, successfulAssetCount: Int, failedAssetCount: Int, totalAssetCount: Int)
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
 * - Immediately starts an instance of EmbeddedAppLoader to load the embedded update into
 *   SQLite. This does nothing if SQLite already has the embedded update or a newer one, but we have
 *   to do this on each cold boot, as we have no way of knowing if a new build was just installed
 *   (which could have a new embedded update).
 * - If the app is configured for automatic update downloads (most apps), starts a timer based on
 *   the `launchWaitMs` value in UpdatesConfig.
 * - Again if the app is configured for automatic update downloads, starts an instance of
 *   RemoteAppLoader to check for and download a new update if there is one.
 * - Once the download succeeds, fails, or the timer runs out (whichever happens first), creates an
 *   instance of AppLauncherWithDatabase and signals that the app is ready to be launched
 *   with the newest update available locally at that time (which may not be the newest update if
 *   the download is still in progress).
 * - If the download succeeds or fails after this point, fires a callback which causes an event to
 *   be sent to JS.
 */
@objc(EXUpdatesAppLoaderTask)
@objcMembers
public final class AppLoaderTask: NSObject {
  public weak var delegate: AppLoaderTaskDelegate?
  public weak var swiftDelegate: AppLoaderTaskSwiftDelegate?

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
    delegateQueue: DispatchQueue,
    logger: UpdatesLogger
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
    self.logger = logger
  }

  public func start() {
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
          let cause = UpdatesError.appLoaderTaskFailedToLaunch(cause: error)
          self.logger.error(
            cause: cause,
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
            self.handleRemoteUpdateResponseLoaded(remoteUpdate, error: remoteError)
          }
        } else {
          self.isRunning = false
          self.runReaper()
          self.delegate.let { it in
            self.delegateQueue.async {
              it.appLoaderTaskDidFinishAllLoading(self)
            }
          }
        }
      }
    }
  }

  private func finish(withError error: UpdatesError?) {
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
            didFinishWithError: error ?? UpdatesError.appLoaderTaskUnexpectedErrorDuringLaunch
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
        launchedUpdate: launchedUpdate,
        logger: self.logger
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
          manifestFilters = try self.database.manifestFilters(withScopeKey: self.config.scopeKey)
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
            // be sending an HTTP request from EmbeddedAppLoader
            self.embeddedAppLoader = EmbeddedAppLoader(
              config: self.config,
              logger: self.logger,
              database: self.database,
              directory: self.directory,
              launchedUpdate: nil,
              completionQueue: self.loaderTaskQueue
            )
            self.embeddedAppLoader!.loadUpdateResponseFromEmbeddedManifest(
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

  private func launch(withCompletion completion: @escaping (_ error: UpdatesError?, _ success: Bool) -> Void) {
    let launcher = AppLauncherWithDatabase(config: config, database: database, directory: directory, completionQueue: loaderTaskQueue, logger: self.logger)
    candidateLauncher = launcher
    launcher.launchUpdate(withSelectionPolicy: selectionPolicy, completion: completion)
  }

  private func loadRemoteUpdate(withCompletion completion: @escaping (_ remoteError: UpdatesError?, _ updateResponse: UpdateResponse?) -> Void) {
    remoteAppLoader = RemoteAppLoader(
      config: config,
      logger: logger,
      database: database,
      directory: directory,
      launchedUpdate: candidateLauncher?.launchedUpdate,
      completionQueue: loaderTaskQueue
    )

    if let swiftDelegate = self.swiftDelegate {
      self.delegateQueue.async {
        swiftDelegate.appLoaderTaskDidStartCheckingForRemoteUpdate(self)
      }
    }
    remoteAppLoader!.loadUpdate(
      fromURL: config.updateUrl
    ) { updateResponse in
      if let updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective {
        switch updateDirective {
        case is NoUpdateAvailableUpdateDirective:
          self.isUpToDate = true
          if let swiftDelegate = self.swiftDelegate {
            self.delegateQueue.async {
              swiftDelegate.appLoaderTask(self, didFinishCheckingForRemoteUpdateWithRemoteCheckResult: RemoteCheckResult.noUpdateAvailable(reason: .noUpdateAvailableOnServer))
            }
          }
          return false
        case let rollBackUpdateDirective as RollBackToEmbeddedUpdateDirective:
          self.isUpToDate = false

          if let swiftDelegate = self.swiftDelegate {
            self.delegateQueue.async {
              swiftDelegate.appLoaderTask(
                self, didFinishCheckingForRemoteUpdateWithRemoteCheckResult: RemoteCheckResult.rollBackToEmbedded(
                  commitTime: rollBackUpdateDirective.commitTime
                )
              )
            }
          }

          if let delegate = self.delegate {
            self.delegateQueue.async {
              delegate.appLoaderTask(self, didStartLoadingUpdate: nil)
            }
          }
          return true
        default:
          NSException(name: .internalInconsistencyException, reason: "Unhandled update directive type").raise()
          return false
        }
      }

      guard let update = updateResponse.manifestUpdateResponsePart?.updateManifest else {
        // No response, so no update available
        self.isUpToDate = true
        if let swiftDelegate = self.swiftDelegate {
          self.delegateQueue.async {
            swiftDelegate.appLoaderTask(self, didFinishCheckingForRemoteUpdateWithRemoteCheckResult: RemoteCheckResult.noUpdateAvailable(reason: .noUpdateAvailableOnServer))
          }
        }
        return false
      }

      if self.selectionPolicy.shouldLoadNewUpdate(
        update,
        withLaunchedUpdate: self.candidateLauncher?.launchedUpdate,
        filters: updateResponse.responseHeaderData?.manifestFilters
      ) {
        // got a response, and it is new so should be downloaded
        self.isUpToDate = false
        if let swiftDelegate = self.swiftDelegate {
          self.delegateQueue.async {
            swiftDelegate.appLoaderTask(
              self,
              didFinishCheckingForRemoteUpdateWithRemoteCheckResult: RemoteCheckResult.updateAvailable(
                manifest: update.manifest.rawManifestJSON()
              )
            )
          }
        }

        if let delegate = self.delegate {
          self.delegateQueue.async {
            delegate.appLoaderTask(self, didStartLoadingUpdate: update)
          }
        }
        return true
      } else {
        // got a response, but we already have it
        self.isUpToDate = true
        if let swiftDelegate = self.swiftDelegate {
          self.delegateQueue.async {
            swiftDelegate.appLoaderTask(self, didFinishCheckingForRemoteUpdateWithRemoteCheckResult: RemoteCheckResult.noUpdateAvailable(reason: .updateRejectedBySelectionPolicy))
          }
        }
        return false
      }
    } asset: { asset, successfulAssetCount, failedAssetCount, totalAssetCount in
      if let swiftDelegate = self.swiftDelegate {
        self.delegateQueue.async {
          swiftDelegate.appLoaderTask(
            self,
            didLoadAsset: asset,
            successfulAssetCount: successfulAssetCount,
            failedAssetCount: failedAssetCount,
            totalAssetCount: totalAssetCount
          )
        }
      }
    } success: { updateResponse in
      completion(nil, updateResponse)
    } error: { error in
      completion(error, nil)
    }
  }

  private func handleRemoteUpdateResponseLoaded(_ updateResponse: UpdateResponse?, error: UpdatesError?) {
    // If the app has not yet been launched (because the timer is still running),
    // create a new launcher so that we can launch with the newly downloaded update.
    // Otherwise, we've already launched. Send an event to the notify JS of the new update.

    loaderTaskQueue.async {
      self.stopTimer()

      RemoteAppLoader.processSuccessLoaderResult(
        config: self.config,
        logger: self.logger,
        database: self.database,
        selectionPolicy: self.selectionPolicy,
        launchedUpdate: self.candidateLauncher?.launchedUpdate,
        directory: self.directory,
        loaderTaskQueue: self.loaderTaskQueue,
        updateResponse: updateResponse,
        priorError: error
      ) { updateToLaunch, error, _ in
        self.launchUpdate(updateToLaunch, error: error)
      }
    }
  }

  private func launchUpdate(_ updateBeingLaunched: Update?, error: UpdatesError?) {
    if let updateBeingLaunched = updateBeingLaunched {
      if !self.hasLaunched {
        let newLauncher = AppLauncherWithDatabase(
          config: self.config,
          database: self.database,
          directory: self.directory,
          completionQueue: self.loaderTaskQueue,
          logger: self.logger
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
            self.logger.warn(message: "Downloaded update but failed to relaunch: \(error?.localizedDescription ?? "")")
          }
          self.didFinishBackgroundUpdate(withStatus: .updateAvailable, update: updateBeingLaunched, error: error)
          self.isRunning = false
          self.runReaper()
        }
      } else {
        self.didFinishBackgroundUpdate(withStatus: .updateAvailable, update: updateBeingLaunched, error: nil)
        self.isRunning = false
        self.runReaper()
        // appLoaderTaskDidFinishAllLoading called as part of didFinishBackgroundUpdate
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
      // appLoaderTaskDidFinishAllLoading called as part of didFinishBackgroundUpdate
    }
  }

  private func didFinishBackgroundUpdate(withStatus status: BackgroundUpdateStatus, update: Update?, error: UpdatesError?) {
    delegate.let { it in
      delegateQueue.async {
        it.appLoaderTask(self, didFinishBackgroundUpdateWithStatus: status, update: update, error: error)
        it.appLoaderTaskDidFinishAllLoading(self)
      }
    }
  }
}

// swiftlint:enable closure_body_length
// swiftlint:enable force_unwrapping
// swiftlint:enable superfluous_else
// swiftlint:enable line_length
