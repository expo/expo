//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation
import EXManifests

func assertType<T>(value: Any, description: String) -> T {
  if !(value is T) {
    let exception = NSException(
      name: NSExceptionName.internalInconsistencyException,
      reason: description,
      userInfo: [:]
    )
    exception.raise()
  }

  // exception above will preempt force_cast
  // swiftlint:disable:next force_cast
  return value as! T
}

public extension Optional {
  func require(_ desc: String) -> Wrapped {
    if self == nil {
      let exception = NSException(
        name: NSExceptionName.internalInconsistencyException,
        reason: desc,
        userInfo: [:]
      )
      exception.raise()
    }

    // exception above will preempt force_unwrapping
    // swiftlint:disable:next force_unwrapping
    return self!
  }
}

/**
 * Download status that indicates whether or under what conditions an
 * update is able to be launched.
 *
 * It's important that the integer value of each status stays constant across
 * all versions of this library since they are stored in SQLite on user devices.
 */
@objc(EXUpdatesUpdateStatus)
public enum UpdateStatus: Int {
  case Status0_Unused = 0
  /**
   * The update has been fully downloaded and is ready to launch.
   */
  case StatusReady = 1
  case Status2_Unused = 2
  /**
   * The update manifest has been download from the server but not all
   * assets have finished downloading successfully.
   */
  case StatusPending = 3
  case Status4_Unused = 4
  /**
   * The update has been partially loaded (copied) from its location
   * embedded in the app bundle, but not all assets have been copied
   * successfully. The update may be able to be launched directly from
   * its embedded location unless a new binary version with a new
   * embedded update has been installed.
   */
  case StatusEmbedded = 5
  /**
   * The update manifest has been downloaded and indicates that the
   * update is being served from a developer tool. It can be launched by a
   * host application that can run a development bundle.
   */
  case StatusDevelopment = 6
}

@objc(EXUpdatesUpdateError)
public enum UpdateError: Int, Error {
  case invalidExpoProtocolVersion
}

@objc(EXUpdatesUpdate)
@objcMembers
public class Update: NSObject {
  public let updateId: UUID
  public let scopeKey: String?
  public var commitTime: Date
  public let runtimeVersion: String
  public let keep: Bool
  public let isDevelopmentMode: Bool
  private let assetsFromManifest: [UpdateAsset]?

  public let manifest: Manifest?

  public var status: UpdateStatus
  public var lastAccessed: Date
  public var successfulLaunchCount: Int
  public var failedLaunchCount: Int

  private let config: UpdatesConfig
  private let database: UpdatesDatabase?

  public init(
    manifest: Manifest?,
    config: UpdatesConfig,
    database: UpdatesDatabase?,
    updateId: UUID,
    scopeKey: String?,
    commitTime: Date,
    runtimeVersion: String,
    keep: Bool,
    status: UpdateStatus,
    isDevelopmentMode: Bool,
    assetsFromManifest: [UpdateAsset]?
  ) {
    self.updateId = updateId
    self.commitTime = commitTime
    self.runtimeVersion = runtimeVersion
    self.keep = keep
    self.manifest = manifest
    self.config = config
    self.database = database
    self.scopeKey = scopeKey
    self.status = status
    self.assetsFromManifest = assetsFromManifest

    self.lastAccessed = Date()
    self.successfulLaunchCount = 0
    self.failedLaunchCount = 0
    self.isDevelopmentMode = isDevelopmentMode
  }

  internal static func update(
    withManifest: [String: Any],
    responseHeaderData: ResponseHeaderData,
    extensions: [String: Any],
    config: UpdatesConfig,
    database: UpdatesDatabase
  ) throws -> Update {
    let protocolVersion = responseHeaderData.protocolVersion
    switch protocolVersion {
    case nil:
      return LegacyUpdate.update(
        withLegacyManifest: LegacyManifest(rawManifestJSON: withManifest),
        config: config,
        database: database
      )
    case 0, 1:
      return NewUpdate.update(
        withNewManifest: NewManifest(rawManifestJSON: withManifest),
        extensions: extensions,
        config: config,
        database: database
      )
    default:
      throw UpdateError.invalidExpoProtocolVersion
    }
  }

  public static func update(
    withEmbeddedManifest: [String: Any],
    config: UpdatesConfig,
    database: UpdatesDatabase?
  ) -> Update {
    if withEmbeddedManifest["releaseId"] != nil {
      return LegacyUpdate.update(
        withLegacyManifest: LegacyManifest(rawManifestJSON: withEmbeddedManifest),
        config: config,
        database: database
      )
    } else {
      return BareUpdate.update(
        withBareManifest: BareManifest(rawManifestJSON: withEmbeddedManifest),
        config: config,
        database: database
      )
    }
  }

  /**
   * Accessing this property may lazily load the assets from the database, if this update object
   * originated from the database.
   */
  public func assets() -> [UpdateAsset]? {
    guard let assetsFromManifest = self.assetsFromManifest else {
      return self.assetsFromDatabase()
    }
    return assetsFromManifest
  }

  private func assetsFromDatabase() -> [UpdateAsset]? {
    guard let database = self.database else {
      return nil
    }

    var assetsLocal: [UpdateAsset] = []
    database.databaseQueue.sync {
      // The pattern is valid, so it'll never throw
      // swiftlint:disable:next force_try
      assetsLocal = try! database.assets(withUpdateId: self.updateId)
    }
    return assetsLocal
  }

  public func loggingId() -> String {
    self.updateId.uuidString.lowercased()
  }
}
