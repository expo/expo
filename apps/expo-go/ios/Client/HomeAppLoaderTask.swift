// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import EXUpdates

@objc(EXHomeAppLoaderTaskDelegate)
public protocol HomeAppLoaderTaskDelegate: AnyObject {
  func homeAppLoaderTask(_: HomeAppLoaderTask, didFinishWithLauncher launcher: AppLauncher)
  func homeAppLoaderTask(_: HomeAppLoaderTask, didFinishWithError error: Error)
}

/**
 Derivation of AppLoaderTask from expo-updates that just does a simple one-loader using HomeAppLoader.
 */
@objc(EXHomeAppLoaderTask)
@objcMembers
public final class HomeAppLoaderTask: NSObject {
  private static let ErrorDomain = "HomeAppLoaderTask"

  public weak var delegate: HomeAppLoaderTaskDelegate?

  private let manifestAndAssetRequestHeaders: ManifestAndAssetRequestHeaders
  private let config: UpdatesConfig
  private let logger = UpdatesLogger()
  private let database: UpdatesDatabase
  private let directory: URL
  private let selectionPolicy: SelectionPolicy
  private let delegateQueue: DispatchQueue

  private let loaderTaskQueue: DispatchQueue

  public required init(
    manifestAndAssetRequestHeaders: ManifestAndAssetRequestHeaders,
    config: UpdatesConfig,
    database: UpdatesDatabase,
    directory: URL,
    selectionPolicy: SelectionPolicy,
    delegateQueue: DispatchQueue
  ) {
    self.manifestAndAssetRequestHeaders = manifestAndAssetRequestHeaders
    self.config = config
    self.database = database
    self.directory = directory
    self.selectionPolicy = selectionPolicy
    self.delegateQueue = delegateQueue
    self.loaderTaskQueue = DispatchQueue(label: "expo.loader.LoaderTaskQueue")
  }

  public func start() {
    self.loadHomeUpdate { remoteError, remoteUpdate in
      self.loaderTaskQueue.async {
        self.launchUpdate(remoteUpdate?.manifestUpdateResponsePart?.updateManifest, error: remoteError)
      }
    }
  }

  private func finish(withLauncher launcher: AppLauncher?, error: Error?) {
    dispatchPrecondition(condition: .onQueue(loaderTaskQueue))

    if let delegate = delegate {
      delegateQueue.async {
        // swiftlint:disable force_unwrapping
        if let launcher = launcher,
          launcher.launchAssetUrl != nil || launcher.launchedUpdate!.status == .StatusDevelopment {
          delegate.homeAppLoaderTask(self, didFinishWithLauncher: launcher)
        } else {
          delegate.homeAppLoaderTask(
            self,
            didFinishWithError: error ?? NSError(
              domain: HomeAppLoaderTask.ErrorDomain,
              code: 1031,
              userInfo: [
                NSLocalizedDescriptionKey: "HomeAppLoaderTask encountered an unexpected error and could not launch an update."
              ]
            )
          )
        }
        // swiftlint:enable force_unwrapping
      }
    }
  }

  private func runReaper(withLauncher launcher: AppLauncher) {
    if let launchedUpdate = launcher.launchedUpdate {
      UpdatesReaper.reapUnusedUpdates(
        withConfig: config,
        database: database,
        directory: directory,
        selectionPolicy: selectionPolicy,
        launchedUpdate: launchedUpdate
      )
    }
  }

  private func loadHomeUpdate(withCompletion completion: @escaping (_ remoteError: Error?, _ updateResponse: UpdateResponse?) -> Void) {
    HomeAppLoader(
      manifestAndAssetRequestHeaders: self.manifestAndAssetRequestHeaders,
      config: config,
      logger: logger,
      database: database,
      directory: directory,
      launchedUpdate: nil,
      completionQueue: loaderTaskQueue
    ).loadHome { _ in
      return true
    } asset: { _, _, _, _ in
      // no-op
    } success: { updateResponse in
      completion(nil, updateResponse)
    } error: { error in
      completion(error, nil)
    }
  }

  private func launchUpdate(_ updateBeingLaunched: Update?, error: Error?) {
    if updateBeingLaunched != nil {
      let launcher = AppLauncherWithDatabase(
        config: self.config,
        database: self.database,
        directory: self.directory,
        completionQueue: self.loaderTaskQueue
      )
      launcher.launchUpdate(withSelectionPolicy: self.selectionPolicy) { error, success in
        if success {
          self.finish(withLauncher: launcher, error: nil)
        } else {
          self.finish(withLauncher: nil, error: error)
          NSLog("Downloaded update but failed to launch: %@", error?.localizedDescription ?? "")
        }
        self.runReaper(withLauncher: launcher)
      }
    } else {
      // there's no update, there should be an error
      self.finish(withLauncher: nil, error: error)
    }
  }
}
