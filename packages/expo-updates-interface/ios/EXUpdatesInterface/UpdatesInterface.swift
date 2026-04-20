//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

public typealias UpdatesErrorBlock = (_ error: Error) -> Void
public typealias UpdatesUpdateSuccessBlock = (_ manifest: [String: Any]?) -> Void
public typealias UpdatesProgressBlock = (_ successfulAssetCount: UInt, _ failedAssetCount: UInt, _ totalAssetCount: UInt) -> Void

/**
 * Called when a manifest has been downloaded. The return value indicates whether or not to
 * continue downloading the update described by this manifest. Returning `NO` will abort the
 * load, and the success block will be immediately called with a nil `manifest`.
 */
public typealias UpdatesManifestBlock = (_ manifest: [String: Any]) -> Bool

/**
 * All updates controllers implement this protocol, which provides information on the running
 * updates system.
 */
@objc(EXUpdatesInterface)
public protocol UpdatesInterface {
  /*
   * Whether updates is enabled
   */
  @objc var isEnabled: Bool { get }
  /*
   * These properties are set when updates is enabled, or the dev client is running
   */
  @objc var runtimeVersion: String? { get }
  @objc var updateURL: URL? { get }
  /*
   * These properties are only set when updates is enabled
   */
  @objc var launchedUpdateId: UUID? { get }
  @objc var embeddedUpdateId: UUID? { get }
  @objc var launchAssetPath: String? { get }
  /*
   * User code or third party modules can add a listener that will be called
   * on updates state machine transitions (only when updates is enabled)
   */
  @objc func subscribeToUpdatesStateChanges(_ listener: any UpdatesStateChangeListener) -> UpdatesStateChangeSubscription
}

/**
 * Implemented only by the dev client updates controller.
 */
@objc(EXUpdatesDevLauncherInterface)
public protocol UpdatesDevLauncherInterface: UpdatesInterface {
  @objc weak var updatesExternalInterfaceDelegate: (any UpdatesExternalInterfaceDelegate)? { get set }
  @objc var launchAssetURL: URL? { get }

  @objc var runtimeVersion: String? { get }
  @objc var updateURL: URL? { get }

  @objc func reset()

  @objc func fetchUpdate(
    withConfiguration configuration: [String: Any],
    onManifest manifestBlock: @escaping UpdatesManifestBlock,
    progress progressBlock: @escaping UpdatesProgressBlock,
    success successBlock: @escaping UpdatesUpdateSuccessBlock,
    error errorBlock: @escaping UpdatesErrorBlock
  )

  @objc func isValidUpdatesConfiguration(_ configuration: [String: Any]) -> Bool
}

/**
 * Protocol for communication/delegation back to the host dev client for functionality.
 */
@objc(EXUpdatesExternalInterfaceDelegate)
public protocol UpdatesExternalInterfaceDelegate {
  @objc func updatesExternalInterfaceDidRequestRelaunch(_ updatesExternalInterface: UpdatesDevLauncherInterface)
}

@objc(EXUpdatesStateChangeListener)
public protocol UpdatesStateChangeListener {
  func updatesStateDidChange(_ event: [String: Any])
}

@objc(EXUpdatesStateChangeSubscription)
public protocol UpdatesStateChangeSubscription {
  /*
   * Call this to remove the subscription and stop receiving state change events
   */
  func remove()
  /*
   * When updates is enabled, returns the current state context as an instance of UpdatesNativeInterfaceStateContext
   */
  func getContext() -> Any?
}

/**
 Expose the state machine context to the native interface.
 */
public struct UpdatesNativeInterfaceStateContext {
  public struct Rollback {
    public let commitTime: Date

    public init(commitTime: Date) {
      self.commitTime = commitTime
    }
  }
  public let isUpdateAvailable: Bool
  public let isUpdatePending: Bool
  public let isChecking: Bool
  public let isDownloading: Bool
  public let isRestarting: Bool
  public let restartCount: Int
  public let latestManifest: [String: Any]?
  public let downloadedManifest: [String: Any]?
  public let rollback: Rollback?
  public let checkError: [String: String]?
  public let downloadError: [String: String]?
  public let downloadProgress: Double
  public let lastCheckForUpdateTime: Date?
  public let sequenceNumber: Int
  public let downloadStartTime: Date?
  public let downloadFinishTime: Date?

  public init(
    isUpdateAvailable: Bool,
    isUpdatePending: Bool,
    isChecking: Bool,
    isDownloading: Bool,
    isRestarting: Bool,
    restartCount: Int,
    latestManifest: [String : Any]?,
    downloadedManifest: [String : Any]?,
    rollback: Rollback?,
    checkError: [String : String]?,
    downloadError: [String : String]?,
    downloadProgress: Double,
    lastCheckForUpdateTime: Date?,
    sequenceNumber: Int,
    downloadStartTime: Date?,
    downloadFinishTime: Date?
  ) {
    self.isUpdateAvailable = isUpdateAvailable
    self.isUpdatePending = isUpdatePending
    self.isChecking = isChecking
    self.isDownloading = isDownloading
    self.isRestarting = isRestarting
    self.restartCount = restartCount
    self.latestManifest = latestManifest
    self.downloadedManifest = downloadedManifest
    self.rollback = rollback
    self.checkError = checkError
    self.downloadError = downloadError
    self.downloadProgress = downloadProgress
    self.lastCheckForUpdateTime = lastCheckForUpdateTime
    self.sequenceNumber = sequenceNumber
    self.downloadStartTime = downloadStartTime
    self.downloadFinishTime = downloadFinishTime
  }
}
