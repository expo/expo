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
  /*
   * User code or third party modules can add a listener that will be called
   * on updates state machine transitions (only when updates is enabled)
   */
  @objc func subscribeToUpdatesStateChanges(_ listener: any UpdatesStateChangeListener) -> String
  @objc func unsubscribeFromUpdatesStateChanges(_ subscriptionId: String)
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
