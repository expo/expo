//  Copyright © 2019 650 Industries. All rights reserved.

// A lot of stuff in this class was originally written in objective-c, and the swift
// equivalents don't seem to work quite the same, which is important to have backwards
// data compatibility.
// swiftlint:disable legacy_objc_type
// swiftlint:disable line_length
// swiftlint:disable type_body_length
// swiftlint:disable force_unwrapping
// swiftlint:disable file_length

import Foundation
import SQLite3
import EXManifests

@objc
public enum EXUpdatesDatabaseError: Int, Error {
  case addExistingAssetMissingAssetKey
  case addExistingAssetInsertError
  case addExistingAssetAssetNotFoundError
  case markMissingAssetsError
  case deleteUpdatesError
  case deleteUnusedAssetsError
  case getUpdatesError
  case setJsonDataError
}

enum EXUpdatesDatabaseHashType: Int {
  case Sha1 = 0
}

@objcMembers
public final class EXUpdatesDatabaseJsonData: NSObject {
  public let jsonData: [String: Any]?

  init(jsonData: [String: Any]?) {
    self.jsonData = jsonData
  }
}

@objcMembers
public final class EXUpdatesDatabaseUpdateSingle: NSObject {
  public let update: EXUpdatesUpdate?

  init(update: EXUpdatesUpdate?) {
    self.update = update
  }
}

@objcMembers
public final class EXUpdatesDatabaseAssetSingle: NSObject {
  public let asset: EXUpdatesAsset?

  init(asset: EXUpdatesAsset?) {
    self.asset = asset
  }
}

/**
 * SQLite database that keeps track of updates currently loaded/loading to disk, including the
 * update manifest and metadata, status, and the individual assets (including bundles/bytecode) that
 * comprise the update. (Assets themselves are stored on the device's file system, and a relative
 * path is kept in SQLite.)
 *
 * SQLite allows a many-to-many relationship between updates and assets, which means we can keep
 * only one copy of each asset on disk at a time while also being able to clear unused assets with
 * relative ease (see EXUpdatesReaper).
 *
 * Occasionally it's necessary to add migrations when the data structures for updates or assets must
 * change. Extra care must be taken here, since these migrations will happen on users' devices for
 * apps we do not control. See
 * https://github.com/expo/expo/blob/main/packages/expo-updates/guides/migrations.md for step by
 * step instructions.
 *
 * EXUpdatesDatabase provides a serial queue on which all database operations must be run (methods
 * in this class will assert). This is primarily for control over what high-level operations
 * involving the database can occur simultaneously - e.g. we don't want to be trying to download a
 * new update at the same time EXUpdatesReaper is running.
 *
 * The `scopeKey` field in various methods here is only relevant in environments such as Expo Go in
 * which updates from multiple scopes can be launched.
 */
@objcMembers
public final class EXUpdatesDatabase: NSObject {
  private static let ManifestFiltersKey = "manifestFilters"
  private static let ServerDefinedHeadersKey = "serverDefinedHeaders"
  private static let StaticBuildDataKey = "staticBuildData"

  public let databaseQueue: DispatchQueue
  private var db: OpaquePointer?

  public required override init() {
    self.databaseQueue = DispatchQueue(label: "expo.database.DatabaseQueue")
  }

  deinit {
    closeDatabase()
  }

  public func openDatabase(inDirectory directory: URL) throws {
    dispatchPrecondition(condition: .onQueue(databaseQueue))
    db = try EXUpdatesDatabaseInitialization.initializeDatabaseWithLatestSchema(inDirectory: directory)
  }

  public func closeDatabase() {
    sqlite3_close(db)
    db = nil
  }

  public func execute(sql: String, withArgs args: [Any?]?) throws -> [[String: Any?]] {
    dispatchPrecondition(condition: .onQueue(databaseQueue))
    return try EXUpdatesDatabaseUtils.execute(sql: sql, withArgs: args, onDatabase: db.require("Missing database handle"))
  }

  public func executeForObjC(sql: String, withArgs args: [Any]?) throws -> [Any] {
    return try execute(sql: sql, withArgs: args)
  }

  public func addUpdate(_ update: EXUpdatesUpdate) throws {
    let sql = """
      INSERT INTO "updates" ("id", "scope_key", "commit_time", "runtime_version", "manifest", "status" , "keep", "last_accessed", "successful_launch_count", "failed_launch_count")
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7, ?8, ?9);
    """
    _ = try execute(
      sql: sql,
      withArgs: [
        update.updateId,
        update.scopeKey,
        update.commitTime,
        update.runtimeVersion,
        update.manifest.rawManifestJSON(),
        update.status.rawValue,
        update.lastAccessed,
        update.successfulLaunchCount,
        update.failedLaunchCount
      ]
    )
  }

  public func addNewAssets(_ assets: [EXUpdatesAsset], toUpdateWithId updateId: UUID) throws {
    sqlite3_exec(db, "BEGIN;", nil, nil, nil)

    let assetInsertSql = """
      INSERT OR REPLACE INTO "assets" ("key", "url", "headers", "extra_request_headers", "type", "metadata", "download_time", "relative_path", "hash", "hash_type", "expected_hash", "marked_for_deletion")
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 0);
    """
    for asset in assets {
      do {
        _ = try execute(
          sql: assetInsertSql,
          withArgs: [
            asset.key,
            asset.url,
            asset.headers,
            asset.extraRequestHeaders,
            asset.type,
            asset.metadata,
            asset.downloadTime.require("asset downloadTime should be nonnull"),
            asset.filename,
            asset.contentHash,
            EXUpdatesDatabaseHashType.Sha1.rawValue,
            asset.expectedHash
          ]
        )
      } catch {
        sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
        return
      }

      // statements must stay in precisely this order for last_insert_rowid() to work correctly
      if asset.isLaunchAsset {
        let updateSql = "UPDATE updates SET launch_asset_id = last_insert_rowid() WHERE id = ?1;"
        do {
          _ = try execute(sql: updateSql, withArgs: [updateId])
        } catch {
          sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
          return
        }
      }

      let updateInsertSql = """
        INSERT OR REPLACE INTO updates_assets ("update_id", "asset_id") VALUES (?1, last_insert_rowid());
      """
      do {
        _ = try execute(sql: updateInsertSql, withArgs: [updateId])
      } catch {
        sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
        return
      }
    }

    sqlite3_exec(db, "COMMIT;", nil, nil, nil)
  }

  public func addExistingAsset(_ asset: EXUpdatesAsset, toUpdateWithId updateId: UUID) throws -> Bool {
    guard let key = asset.key else {
      return false
    }

    sqlite3_exec(db, "BEGIN;", nil, nil, nil)

    let assetSelectSql = """
      SELECT id FROM assets WHERE "key" = ?1 LIMIT 1;
    """
    let rows = try execute(sql: assetSelectSql, withArgs: [key])
    if !rows.isEmpty {
      let assetId: NSNumber = rows[0].requiredValue(forKey: "id")
      let insertSql = """
        INSERT OR REPLACE INTO updates_assets ("update_id", "asset_id") VALUES (?1, ?2);
      """
      do {
        _ = try execute(sql: insertSql, withArgs: [updateId, assetId.intValue])
      } catch {
        sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
        throw EXUpdatesDatabaseError.addExistingAssetInsertError
      }

      if asset.isLaunchAsset {
        let updateSql = "UPDATE updates SET launch_asset_id = ?1 WHERE id = ?2;"
        do {
          _ = try execute(sql: updateSql, withArgs: [assetId.intValue, updateId])
        } catch {
          sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
          throw EXUpdatesDatabaseError.addExistingAssetInsertError
        }
      }
    }

    sqlite3_exec(db, "COMMIT;", nil, nil, nil)

    if rows.isEmpty {
      return false
    }
    
    return true
  }

  public func updateAsset(_ asset: EXUpdatesAsset) throws {
    let assetUpdateSql = """
      UPDATE "assets" SET "headers" = ?2, "extra_request_headers" = ?3, "type" = ?4, "metadata" = ?5, "download_time" = ?6, "relative_path" = ?7, "hash" = ?8, "expected_hash" = ?9, "url" = ?10 WHERE "key" = ?1;
    """
    _ = try execute(
      sql: assetUpdateSql,
      withArgs: [
        asset.key,
        asset.headers,
        asset.extraRequestHeaders,
        asset.type,
        asset.metadata,
        asset.downloadTime.require("asset downloadTime should be nonnull"),
        asset.filename,
        asset.contentHash.require("asset contentHash should be nonnull"),
        asset.expectedHash,
        asset.url?.absoluteString
      ]
    )
  }

  public func mergeAsset(_ asset: EXUpdatesAsset, withExistingEntry existingAsset: EXUpdatesAsset) throws {
    var shouldUpdate = false

    // if the existing entry came from an embedded manifest, it may not have a URL in the database
    if let url = asset.url,
      existingAsset.url == nil || url != existingAsset.url {
      existingAsset.url = url
      shouldUpdate = true
    }

    if let extraRequestHeaders = asset.extraRequestHeaders,
      existingAsset.extraRequestHeaders == nil || !NSDictionary(dictionary: extraRequestHeaders).isEqual(to: existingAsset.extraRequestHeaders!) {
      existingAsset.extraRequestHeaders = extraRequestHeaders
      shouldUpdate = true
    }

    if shouldUpdate {
      try updateAsset(existingAsset)
    }

    // all other properties should be overridden by database values
    asset.filename = existingAsset.filename
    asset.contentHash = existingAsset.contentHash
    asset.expectedHash = existingAsset.expectedHash
    asset.downloadTime = existingAsset.downloadTime
  }

  public func markUpdateFinished(_ update: EXUpdatesUpdate) throws {
    if update.status != EXUpdatesUpdateStatus.StatusDevelopment {
      update.status = EXUpdatesUpdateStatus.StatusReady
    }

    let updateSql = "UPDATE updates SET status = ?1, keep = 1 WHERE id = ?2;"
    _ = try execute(sql: updateSql, withArgs: [update.status.rawValue, update.updateId])
  }

  public func markUpdateAccessed(_ update: EXUpdatesUpdate) throws {
    update.lastAccessed = Date()
    let updateSql = "UPDATE updates SET last_accessed = ?1 WHERE id = ?2;"
    _ = try execute(sql: updateSql, withArgs: [update.lastAccessed, update.updateId])
  }

  public func incrementSuccessfulLaunchCountForUpdate(_ update: EXUpdatesUpdate) throws {
    update.successfulLaunchCount += 1
    let updateSql = "UPDATE updates SET successful_launch_count = ?1 WHERE id = ?2;"
    _ = try execute(sql: updateSql, withArgs: [update.successfulLaunchCount, update.updateId])
  }

  public func incrementFailedLaunchCountForUpdate(_ update: EXUpdatesUpdate) throws {
    update.failedLaunchCount += 1
    let updateSql = "UPDATE updates SET failed_launch_count = ?1 WHERE id = ?2;"
    _ = try execute(sql: updateSql, withArgs: [update.failedLaunchCount, update.updateId])
  }

  public func setScopeKey(_ scopeKey: String, onUpdate update: EXUpdatesUpdate) throws {
    let updateSql = "UPDATE updates SET scope_key = ?1 WHERE id = ?2;"
    _ = try execute(sql: updateSql, withArgs: [scopeKey, update.updateId])
  }

  public func markMissingAssets(_ assets: [EXUpdatesAsset]) throws {
    sqlite3_exec(db, "BEGIN;", nil, nil, nil)

    let updateSql = "UPDATE updates SET status = ?1 WHERE id IN (SELECT DISTINCT update_id FROM updates_assets WHERE asset_id = ?2);"
    for asset in assets {
      do {
        _ = try execute(sql: updateSql, withArgs: [EXUpdatesUpdateStatus.StatusPending.rawValue, asset.assetId])
      } catch {
        sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
        throw EXUpdatesDatabaseError.markMissingAssetsError
      }
    }

    sqlite3_exec(db, "COMMIT;", nil, nil, nil)
  }

  public func deleteUpdates(_ updates: [EXUpdatesUpdate]) throws {
    sqlite3_exec(db, "BEGIN;", nil, nil, nil)

    let updateSql = "DELETE FROM updates WHERE id = ?1;"
    for update in updates {
      do {
        _ = try execute(sql: updateSql, withArgs: [update.updateId])
      } catch {
        sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
        throw EXUpdatesDatabaseError.deleteUpdatesError
      }
    }

    sqlite3_exec(db, "COMMIT;", nil, nil, nil)
  }

  public func deleteUnusedAssets() throws -> [EXUpdatesAsset] {
    // the simplest way to mark the assets we want to delete
    // is to mark all assets for deletion, then go back and unmark
    // those assets in updates we want to keep
    // this is safe as long as we do this inside of a transaction

    sqlite3_exec(db, "BEGIN;", nil, nil, nil)

    let update1Sql = "UPDATE assets SET marked_for_deletion = 1;"
    do {
      _ = try execute(sql: update1Sql, withArgs: nil)
    } catch {
      sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
      throw EXUpdatesDatabaseError.deleteUnusedAssetsError
    }

    let update2Sql = "UPDATE assets SET marked_for_deletion = 0 WHERE id IN (SELECT asset_id FROM updates_assets INNER JOIN updates ON updates_assets.update_id = updates.id WHERE updates.keep = 1);"
    do {
      _ = try execute(sql: update2Sql, withArgs: nil)
    } catch {
      sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
      throw EXUpdatesDatabaseError.deleteUnusedAssetsError
    }

    // check for duplicate rows representing a single file on disk
    let update3Sql = "UPDATE assets SET marked_for_deletion = 0 WHERE relative_path IN (SELECT relative_path FROM assets WHERE marked_for_deletion = 0);"
    do {
      _ = try execute(sql: update3Sql, withArgs: nil)
    } catch {
      sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
      throw EXUpdatesDatabaseError.deleteUnusedAssetsError
    }

    var rows: [[String: Any?]]
    let selectSql = "SELECT * FROM assets WHERE marked_for_deletion = 1;"
    do {
      rows = try execute(sql: selectSql, withArgs: nil)
    } catch {
      sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
      throw EXUpdatesDatabaseError.deleteUnusedAssetsError
    }

    let assets = rows.map { row in
      asset(withRow: row)
    }

    let deleteSql = "DELETE FROM assets WHERE marked_for_deletion = 1;"
    do {
      _ = try execute(sql: deleteSql, withArgs: nil)
    } catch {
      sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
      throw EXUpdatesDatabaseError.deleteUnusedAssetsError
    }

    sqlite3_exec(db, "COMMIT;", nil, nil, nil)

    return assets
  }

  public func allUpdates(withConfig config: EXUpdatesConfig) throws -> [EXUpdatesUpdate] {
    let sql = "SELECT * FROM updates;"
    let rows = try execute(sql: sql, withArgs: nil)
    return rows.map { row in
      update(withRow: row, config: config)
    }
  }

  public func allUpdates(withStatus status: EXUpdatesUpdateStatus, config: EXUpdatesConfig) throws -> [EXUpdatesUpdate] {
    let sql = "SELECT * FROM updates WHERE status = ?1;"
    let rows = try execute(sql: sql, withArgs: [status.rawValue])
    return rows.map { row in
      update(withRow: row, config: config)
    }
  }

  public func allUpdateIds(withStatus status: EXUpdatesUpdateStatus) throws -> [UUID] {
    let sql = "SELECT id FROM updates WHERE status = ?1;"
    let rows = try execute(sql: sql, withArgs: [status.rawValue])
    return rows.map { row in
      // swiftlint:disable:next force_cast
      row["id"] as! UUID
    }
  }

  public func launchableUpdates(withConfig config: EXUpdatesConfig) throws -> [EXUpdatesUpdate] {
    // if an update has successfully launched at least once, we treat it as launchable
    // even if it has also failed to launch at least once
    let sql = String(
      format: "SELECT * FROM updates WHERE scope_key = ?1 AND (successful_launch_count > 0 OR failed_launch_count < 1) AND status IN (%li, %li, %li);",
      EXUpdatesUpdateStatus.StatusReady.rawValue,
      EXUpdatesUpdateStatus.StatusEmbedded.rawValue,
      EXUpdatesUpdateStatus.StatusDevelopment.rawValue
    )

    let rows = try execute(sql: sql, withArgs: [config.scopeKey])
    return rows.map { row in
      update(withRow: row, config: config)
    }
  }

  public func update(withId updateId: UUID, config: EXUpdatesConfig) throws -> EXUpdatesDatabaseUpdateSingle {
    let sql = "SELECT * FROM updates WHERE updates.id = ?1;"
    let rows = try execute(sql: sql, withArgs: [updateId])
    if rows.isEmpty {
      return EXUpdatesDatabaseUpdateSingle(update: nil)
    }
    return EXUpdatesDatabaseUpdateSingle(update: update(withRow: rows.first!, config: config))
  }

  public func allAssets() throws -> [EXUpdatesAsset] {
    let sql = "SELECT * FROM assets;"
    let rows = try execute(sql: sql, withArgs: nil)
    return rows.map { row in
      asset(withRow: row)
    }
  }

  public func assets(withUpdateId updateId: UUID) throws -> [EXUpdatesAsset] {
    let sql = "SELECT assets.*, launch_asset_id FROM assets INNER JOIN updates_assets ON updates_assets.asset_id = assets.id INNER JOIN updates ON updates_assets.update_id = updates.id WHERE updates.id = ?1;"
    let rows = try execute(sql: sql, withArgs: [updateId])
    return rows.map { row in
      asset(withRow: row)
    }
  }

  public func asset(withKey key: String?) throws -> EXUpdatesDatabaseAssetSingle {
    guard let key = key else {
      return EXUpdatesDatabaseAssetSingle(asset: nil)
    }

    let sql = """
      SELECT * FROM assets WHERE "key" = ?1 LIMIT 1;
    """

    let rows = try execute(sql: sql, withArgs: [key])
    if rows.isEmpty {
      return EXUpdatesDatabaseAssetSingle(asset: nil)
    }
    return EXUpdatesDatabaseAssetSingle(asset: asset(withRow: rows.first!))
  }

  private func jsonData(withKey key: String, scopeKey: String) throws -> EXUpdatesDatabaseJsonData {
    let sql = """
      SELECT * FROM json_data WHERE "key" = ?1 AND "scope_key" = ?2
    """
    let rows = try execute(sql: sql, withArgs: [key, scopeKey])
    guard let firstRow = rows.first,
      let value = firstRow["value"] as? String else {
      return EXUpdatesDatabaseJsonData(jsonData: nil)
    }

    return EXUpdatesDatabaseJsonData(jsonData: try JSONSerialization.jsonObject(with: value.data(using: .utf8)!) as? [String: Any])
  }

  private func setJsonData(_ data: [String: Any], withKey key: String, scopeKey: String, isInTransaction: Bool) throws {
    if !isInTransaction {
      sqlite3_exec(db, "BEGIN;", nil, nil, nil)
    }

    let deleteSql = """
      DELETE FROM json_data WHERE "key" = ?1 AND "scope_key" = ?2;
    """
    do {
      _ = try execute(sql: deleteSql, withArgs: [key, scopeKey])
    } catch {
      if !isInTransaction {
        sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
      }
      throw EXUpdatesDatabaseError.setJsonDataError
    }

    let insertSql = """
      INSERT INTO json_data ("key", "value", "last_updated", "scope_key") VALUES (?1, ?2, ?3, ?4);
    """
    do {
      _ = try execute(sql: insertSql, withArgs: [key, data, Date().timeIntervalSince1970 * 1000, scopeKey])
    } catch {
      if !isInTransaction {
        sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
      }
      throw EXUpdatesDatabaseError.setJsonDataError
    }

    if !isInTransaction {
      sqlite3_exec(db, "COMMIT;", nil, nil, nil)
    }
  }

  public func serverDefinedHeaders(withScopeKey scopeKey: String) throws -> EXUpdatesDatabaseJsonData {
    return try jsonData(withKey: EXUpdatesDatabase.ServerDefinedHeadersKey, scopeKey: scopeKey)
  }

  public func manifestFilters(withScopeKey scopeKey: String) throws -> EXUpdatesDatabaseJsonData {
    return try jsonData(withKey: EXUpdatesDatabase.ManifestFiltersKey, scopeKey: scopeKey)
  }

  public func staticBuildData(withScopeKey scopeKey: String) throws -> EXUpdatesDatabaseJsonData {
    return try jsonData(withKey: EXUpdatesDatabase.StaticBuildDataKey, scopeKey: scopeKey)
  }

  public func setServerDefinedHeaders(_ serverDefinedHeaders: [String: Any], withScopeKey scopeKey: String) throws {
    return try setJsonData(serverDefinedHeaders, withKey: EXUpdatesDatabase.ServerDefinedHeadersKey, scopeKey: scopeKey, isInTransaction: false)
  }

  public func setManifestFilters(_ manifestFilters: [String: Any], withScopeKey scopeKey: String) throws {
    return try setJsonData(manifestFilters, withKey: EXUpdatesDatabase.ManifestFiltersKey, scopeKey: scopeKey, isInTransaction: false)
  }

  public func setStaticBuildData(_ staticBuildData: [String: Any], withScopeKey scopeKey: String) throws {
    return try setJsonData(staticBuildData, withKey: EXUpdatesDatabase.StaticBuildDataKey, scopeKey: scopeKey, isInTransaction: false)
  }

  public func setMetadata(withManifest updateManifest: EXUpdatesUpdate) throws {
    sqlite3_exec(db, "BEGIN;", nil, nil, nil)

    if let serverDefinedHeaders = updateManifest.serverDefinedHeaders {
      do {
        _ = try setJsonData(serverDefinedHeaders, withKey: EXUpdatesDatabase.ServerDefinedHeadersKey, scopeKey: updateManifest.scopeKey, isInTransaction: true)
      } catch {
        sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
        throw EXUpdatesDatabaseError.setJsonDataError
      }
    }

    if let manifestFilters = updateManifest.manifestFilters {
      do {
        _ = try setJsonData(manifestFilters, withKey: EXUpdatesDatabase.ManifestFiltersKey, scopeKey: updateManifest.scopeKey, isInTransaction: true)
      } catch {
        sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
        throw EXUpdatesDatabaseError.setJsonDataError
      }
    }

    sqlite3_exec(db, "COMMIT;", nil, nil, nil)
  }

  private func update(withRow row: [String: Any?], config: EXUpdatesConfig) -> EXUpdatesUpdate {
    let rowManifest = row["manifest"]
    var manifest: [String: Any]?
    if let rowManifest = rowManifest as? String {
      manifest = (try? JSONSerialization.jsonObject(with: rowManifest.data(using: .utf8)!) as? [String: Any]).require("Update manifest should be a valid JSON object")
    }

    let keep: NSNumber = row.requiredValue(forKey: "keep")
    let status: NSNumber = row.requiredValue(forKey: "status")
    let successfulLaunchCount: NSNumber = row.requiredValue(forKey: "successful_launch_count")
    let failedLaunchCount: NSNumber = row.requiredValue(forKey: "failed_launch_count")

    let update = EXUpdatesUpdate(
      manifest: EXManifestsManifestFactory.manifest(forManifestJSON: manifest ?? [:]),
      config: config,
      database: self,
      updateId: row.requiredValue(forKey: "id"),
      scopeKey: row.requiredValue(forKey: "scope_key"),
      commitTime: EXUpdatesDatabaseUtils.date(fromUnixTimeMilliseconds: row.requiredValue(forKey: "commit_time")),
      runtimeVersion: row.requiredValue(forKey: "runtime_version"),
      keep: keep.intValue != 0,
      status: EXUpdatesUpdateStatus.init(rawValue: status.intValue)!,
      isDevelopmentMode: false,
      assetsFromManifest: nil
    )
    update.lastAccessed = EXUpdatesDatabaseUtils.date(fromUnixTimeMilliseconds: row.requiredValue(forKey: "last_accessed"))
    update.successfulLaunchCount = successfulLaunchCount.intValue
    update.failedLaunchCount = failedLaunchCount.intValue
    return update
  }

  private func asset(withRow row: [String: Any?]) -> EXUpdatesAsset {
    let rowMetadata = row["metadata"]
    var metadata: [String: Any]?
    if let rowMetadata = rowMetadata as? String {
      metadata = (try? JSONSerialization.jsonObject(with: rowMetadata.data(using: .utf8)!) as? [String: Any]).require("Asset metadata should be a valid JSON object")
    }

    let rowExtraRequestHeaders = row["extra_request_headers"]
    var extraRequestHeaders: [String: Any]?
    if let rowExtraRequestHeaders = rowExtraRequestHeaders as? String {
      extraRequestHeaders = (try? JSONSerialization.jsonObject(with: rowExtraRequestHeaders.data(using: .utf8)!) as? [String: Any]).require("Asset extra_request_headers should be a valid JSON object")
    }

    let launchAssetId: NSNumber? = row.optionalValue(forKey: "launch_asset_id")

    var url: URL?
    let rowUrl: Any? = row.optionalValue(forKey: "url")
    if let rowUrl = rowUrl as? String {
      url = URL(string: rowUrl)
    }

    var key: String?
    let rowKey: Any? = row.optionalValue(forKey: "key")
    if let rowKey = rowKey as? String {
      key = rowKey
    }

    let assetId: NSNumber = row.requiredValue(forKey: "id")
    let asset = EXUpdatesAsset(key: key, type: row.optionalValue(forKey: "type"))
    asset.assetId = assetId.intValue
    asset.url = url
    asset.extraRequestHeaders = extraRequestHeaders
    asset.downloadTime = EXUpdatesDatabaseUtils.date(fromUnixTimeMilliseconds: row.requiredValue(forKey: "download_time"))
    asset.filename = row.requiredValue(forKey: "relative_path")
    asset.contentHash = row.requiredValue(forKey: "hash")
    asset.expectedHash = row.optionalValue(forKey: "expected_hash")
    asset.metadata = metadata

    if let launchAssetId = launchAssetId?.intValue,
       launchAssetId == assetId.intValue {
      asset.isLaunchAsset = true
    } else {
      asset.isLaunchAsset = false
    }

    return asset
  }
}
