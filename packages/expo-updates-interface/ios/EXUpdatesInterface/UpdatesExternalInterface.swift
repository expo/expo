//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation

public typealias UpdatesErrorBlock = (_ error: Error) -> Void
public typealias UpdatesUpdateSuccessBlock = (_ manifest: [String: Any]?) -> Void
public typealias UpdatesQuerySuccessBlock = (_ updateIds: [UUID]) -> Void
public typealias UpdatesProgressBlock = (_ successfulAssetCount: UInt, _ failedAssetCount: UInt, _ totalAssetCount: UInt) -> Void

/**
 * Called when a manifest has been downloaded. The return value indicates whether or not to
 * continue downloading the update described by this manifest. Returning `NO` will abort the
 * load, and the success block will be immediately called with a nil `manifest`.
 */
public typealias UpdatesManifestBlock = (_ manifest: [String: Any]) -> Bool

/**
 * Protocol for modules that depend on expo-updates for loading production updates but do not want
 * to depend on expo-updates or delegate control to the singleton EXUpdatesAppController.
 */
@objc(EXUpdatesExternalInterface)
public protocol UpdatesExternalInterface {
  @objc weak var bridge: AnyObject? { get set }
  @objc var launchAssetURL: URL? { get }

  @objc func reset()

  @objc func fetchUpdate(
    withConfiguration configuration: [String: Any],
    onManifest manifestBlock: @escaping UpdatesManifestBlock,
    progress progressBlock: @escaping UpdatesProgressBlock,
    success successBlock: @escaping UpdatesUpdateSuccessBlock,
    error errorBlock: @escaping UpdatesErrorBlock
  )

  /**
   * Obtains a list of UUIDs for updates already in the updates DB that are in the READY state.
   * The success block will pass in the array of UUIDs
   */
  @objc func storedUpdateIds(
    withConfiguration configuration: [String: Any],
    success successBlock: @escaping UpdatesQuerySuccessBlock,
    error errorBlock: @escaping UpdatesErrorBlock
  )
}
