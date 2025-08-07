//  Copyright © 2019 650 Industries. All rights reserved.

// A lot of stuff in this class was originally written in objective-c, and the swift
// equivalents don't seem to work quite the same, which is important to have backwards
// data compatibility.
// swiftlint:disable legacy_objc_type
// swiftlint:disable line_length
// swiftlint:disable force_unwrapping
// swiftlint:disable identifier_name

import Foundation
#if canImport(sqlite3)
import sqlite3
#else
import SQLite3
#endif
import EXManifests

internal enum UpdatesDatabaseError: Error, Sendable, LocalizedError {
  case addExistingAssetInsertOrReplaceIntoError(cause: Error)
  case addExistingAssetUpdateLaunchAssetError(cause: Error)
  case markMissingAssetsError(cause: Error)
  case deleteUpdatesError(cause: Error)
  case deleteUnusedAssetsError(cause: Error)
  case setJsonDataError(cause: Error)

  var errorDescription: String? {
    switch self {
    case let .addExistingAssetInsertOrReplaceIntoError(cause):
      return "Database error while inserting asset: \(cause.localizedDescription)"
    case let .addExistingAssetUpdateLaunchAssetError(cause):
      return "Database error while updating launch asset on update: \(cause.localizedDescription)"
    case let .markMissingAssetsError(cause):
      return "Database error while marking missing assets: \(cause.localizedDescription)"
    case let .deleteUpdatesError(cause):
      return "Database error while deleting updates: \(cause.localizedDescription)"
    case let .deleteUnusedAssetsError(cause):
      return "Database error while deleting unused assets: \(cause.localizedDescription)"
    case let .setJsonDataError(cause):
      return "Database error while setting JSON data: \(cause.localizedDescription)"
    }
  }
}

enum UpdatesDatabaseHashType: Int {
  case Sha1 = 0
}

/**
 * SQLite database that keeps track of updates currently loaded/loading to disk, including the
 * update manifest and metadata, status, and the individual assets (including bundles/bytecode) that
 * comprise the update. (Assets themselves are stored on the device's file system, and a relative
 * path is kept in SQLite.)
 *
 * SQLite allows a many-to-many relationship between updates and assets, which means we can keep
 * only one copy of each asset on disk at a time while also being able to clear unused assets with
 * relative ease (see UpdatesReaper).
 *
 * Occasionally it's necessary to add migrations when the data structures for updates or assets must
 * change. Extra care must be taken here, since these migrations will happen on users' devices for
 * apps we do not control. See
 * https://github.com/expo/expo/blob/main/packages/expo-updates/guides/migrations.md for step by
 * step instructions.
 *
 * UpdatesDatabase provides a serial queue on which all database operations must be run (methods
 * in this class will assert). This is primarily for control over what high-level operations
 * involving the database can occur simultaneously - e.g. we don't want to be trying to download a
 * new update at the same time UpdatesReaper is running.
 *
 * The `scopeKey` field in various methods here is only relevant in environments such as Expo Go in
 * which updates from multiple scopes can be launched.
 */
@objc(EXUpdatesDatabase)
@objcMembers
public final class UpdatesDatabase: NSObject {
  internal enum JSONDataKey: String {
    case ManifestFiltersKey = "manifestFilters"
    case ServerDefinedHeadersKey = "serverDefinedHeaders"
    case StaticBuildDataKey = "staticBuildData"
    case ExtraParmasKey = "extraParams"
  }

  public let databaseQueue: DispatchQueue
  private var db: OpaquePointer?

  public required override init() {
    self.databaseQueue = DispatchQueue(label: "expo.database.DatabaseQueue")
  }

  deinit {
    closeDatabase()
  }

  public func openDatabase(inDirectory directory: URL, logger: UpdatesLogger) throws {
    dispatchPrecondition(condition: .onQueue(databaseQueue))
    db = try UpdatesDatabaseInitialization.initializeDatabaseWithLatestSchema(inDirectory: directory, logger: logger)
  }

  public func closeDatabase() {
    sqlite3_close(db)
    db = nil
  }

  public func execute(sql: String, withArgs args: [Any?]?) throws -> [[String: Any?]] {
    dispatchPrecondition(condition: .onQueue(databaseQueue))
    return try UpdatesDatabaseUtils.execute(sql: sql, withArgs: args, onDatabase: db.require("Missing database handle"))
  }

  public func executeForObjC(sql: String, withArgs args: [Any]?) throws -> [Any] {
    return try execute(sql: sql, withArgs: args)
  }

  public func addUpdate(_ update: Update, config: UpdatesConfig) throws {
    let sql = """
      INSERT INTO "updates" ("id", "scope_key", "commit_time", "runtime_version", "manifest", "status" , "keep", "last_accessed", "successful_launch_count", "failed_launch_count", "url", "headers")
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7, ?8, ?9, ?10, ?11);
    """
    _ = try execute(
      sql: sql,
      withArgs: [
        update.updateId,
        update.scopeKey.require("Update must have scopeKey to be stored in database"),
        update.commitTime,
        update.runtimeVersion,
        update.manifest.rawManifestJSON(),
        update.status.rawValue,
        update.lastAccessed,
        update.successfulLaunchCount,
        update.failedLaunchCount,
        config.updateUrl.absoluteString,
        Self.encodeRequestHeaders(config.requestHeaders)
      ]
    )
  }

  public func addNewAssets(_ assets: [UpdateAsset], toUpdateWithId updateId: UUID) throws {
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
            UpdatesDatabaseHashType.Sha1.rawValue,
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

  public func addExistingAsset(_ asset: UpdateAsset, toUpdateWithId updateId: UUID) throws -> Bool {
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
        throw UpdatesDatabaseError.addExistingAssetInsertOrReplaceIntoError(cause: error)
      }

      if asset.isLaunchAsset {
        let updateSql = "UPDATE updates SET launch_asset_id = ?1 WHERE id = ?2;"
        do {
          _ = try execute(sql: updateSql, withArgs: [assetId.intValue, updateId])
        } catch {
          sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
          throw UpdatesDatabaseError.addExistingAssetUpdateLaunchAssetError(cause: error)
        }
      }
    }

    sqlite3_exec(db, "COMMIT;", nil, nil, nil)

    if rows.isEmpty {
      return false
    }

    return true
  }

  public func updateAsset(_ asset: UpdateAsset) throws {
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

  public func mergeAsset(_ asset: UpdateAsset, withExistingEntry existingAsset: UpdateAsset) throws {
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

  public func markUpdateFinished(_ update: Update) throws {
    if update.status != UpdateStatus.StatusDevelopment {
      update.status = UpdateStatus.StatusReady
    }

    let updateSql = "UPDATE updates SET status = ?1, keep = 1 WHERE id = ?2;"
    _ = try execute(sql: updateSql, withArgs: [update.status.rawValue, update.updateId])
  }

  public func markUpdateAccessed(_ update: Update) throws {
    update.lastAccessed = Date()
    let updateSql = "UPDATE updates SET last_accessed = ?1 WHERE id = ?2;"
    _ = try execute(sql: updateSql, withArgs: [update.lastAccessed, update.updateId])
  }

  public func incrementSuccessfulLaunchCountForUpdate(_ update: Update) throws {
    update.successfulLaunchCount += 1
    let updateSql = "UPDATE updates SET successful_launch_count = ?1 WHERE id = ?2;"
    _ = try execute(sql: updateSql, withArgs: [update.successfulLaunchCount, update.updateId])
  }

  public func incrementFailedLaunchCountForUpdate(_ update: Update) throws {
    update.failedLaunchCount += 1
    let updateSql = "UPDATE updates SET failed_launch_count = ?1 WHERE id = ?2;"
    _ = try execute(sql: updateSql, withArgs: [update.failedLaunchCount, update.updateId])
  }

  public func setScopeKey(_ scopeKey: String, onUpdate update: Update) throws {
    let updateSql = "UPDATE updates SET scope_key = ?1 WHERE id = ?2;"
    _ = try execute(sql: updateSql, withArgs: [scopeKey, update.updateId])
  }

  public func setUpdateCommitTime(_ commitTime: Date, onUpdate update: Update) throws {
    let updateSql = "UPDATE updates SET commit_time = ?1 WHERE id = ?2;"
    _ = try execute(sql: updateSql, withArgs: [commitTime, update.updateId])
  }

  public func markMissingAssets(_ assets: [UpdateAsset]) throws {
    sqlite3_exec(db, "BEGIN;", nil, nil, nil)

    let updateSql = "UPDATE updates SET status = ?1 WHERE id IN (SELECT DISTINCT update_id FROM updates_assets WHERE asset_id = ?2);"
    for asset in assets {
      do {
        _ = try execute(sql: updateSql, withArgs: [UpdateStatus.StatusPending.rawValue, asset.assetId])
      } catch {
        sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
        throw UpdatesDatabaseError.markMissingAssetsError(cause: error)
      }
    }

    sqlite3_exec(db, "COMMIT;", nil, nil, nil)
  }

  public func deleteUpdates(_ updates: [Update]) throws {
    sqlite3_exec(db, "BEGIN;", nil, nil, nil)

    let updateSql = "DELETE FROM updates WHERE id = ?1;"
    for update in updates {
      do {
        _ = try execute(sql: updateSql, withArgs: [update.updateId])
      } catch {
        sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
        throw UpdatesDatabaseError.deleteUpdatesError(cause: error)
      }
    }

    sqlite3_exec(db, "COMMIT;", nil, nil, nil)
  }

  public func deleteUnusedAssets() throws -> [UpdateAsset] {
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
      throw UpdatesDatabaseError.deleteUnusedAssetsError(cause: error)
    }

    let update2Sql = "UPDATE assets SET marked_for_deletion = 0 WHERE id IN (SELECT asset_id FROM updates_assets INNER JOIN updates ON updates_assets.update_id = updates.id WHERE updates.keep = 1);"
    do {
      _ = try execute(sql: update2Sql, withArgs: nil)
    } catch {
      sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
      throw UpdatesDatabaseError.deleteUnusedAssetsError(cause: error)
    }

    // check for duplicate rows representing a single file on disk
    let update3Sql = "UPDATE assets SET marked_for_deletion = 0 WHERE relative_path IN (SELECT relative_path FROM assets WHERE marked_for_deletion = 0);"
    do {
      _ = try execute(sql: update3Sql, withArgs: nil)
    } catch {
      sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
      throw UpdatesDatabaseError.deleteUnusedAssetsError(cause: error)
    }

    var rows: [[String: Any?]]
    let selectSql = "SELECT * FROM assets WHERE marked_for_deletion = 1;"
    do {
      rows = try execute(sql: selectSql, withArgs: nil)
    } catch {
      sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
      throw UpdatesDatabaseError.deleteUnusedAssetsError(cause: error)
    }

    let assets = rows.map { row in
      asset(withRow: row)
    }

    let deleteSql = "DELETE FROM assets WHERE marked_for_deletion = 1;"
    do {
      _ = try execute(sql: deleteSql, withArgs: nil)
    } catch {
      sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
      throw UpdatesDatabaseError.deleteUnusedAssetsError(cause: error)
    }

    sqlite3_exec(db, "COMMIT;", nil, nil, nil)

    return assets
  }

  public func allUpdates(withConfig config: UpdatesConfig) throws -> [Update] {
    let sql = "SELECT * FROM updates;"
    let rows = try execute(sql: sql, withArgs: nil)
    return rows.map { row in
      update(withRow: row, config: config)
    }
  }

  public func allUpdates(withStatus status: UpdateStatus, config: UpdatesConfig) throws -> [Update] {
    let sql = "SELECT * FROM updates WHERE status = ?1;"
    let rows = try execute(sql: sql, withArgs: [status.rawValue])
    return rows.map { row in
      update(withRow: row, config: config)
    }
  }

  public func recentUpdateIdsWithFailedLaunch() throws -> [UUID] {
    let sql = "SELECT id FROM updates WHERE failed_launch_count > 0 ORDER BY commit_time DESC LIMIT 5;"
    let rows = try execute(sql: sql, withArgs: nil)
    return rows.map { row in row.requiredValue(forKey: "id") }
  }

  public func launchableUpdates(withConfig config: UpdatesConfig) throws -> [Update] {
    // if an update has successfully launched at least once, we treat it as launchable
    // even if it has also failed to launch at least once
    let sql = String(
      format: "SELECT * FROM updates WHERE scope_key = ?1 AND (successful_launch_count > 0 OR failed_launch_count < 1) AND status IN (%li, %li, %li);",
      UpdateStatus.StatusReady.rawValue,
      UpdateStatus.StatusEmbedded.rawValue,
      UpdateStatus.StatusDevelopment.rawValue
    )

    let rows = try execute(sql: sql, withArgs: [config.scopeKey])
    return rows.map { row in
      update(withRow: row, config: config)
    }
  }

  public func update(withId updateId: UUID, config: UpdatesConfig) throws -> Update? {
    let sql = "SELECT * FROM updates WHERE updates.id = ?1;"
    let rows = try execute(sql: sql, withArgs: [updateId])
    if rows.isEmpty {
      return nil
    }
    return update(withRow: rows.first!, config: config)
  }

  public func allAssets() throws -> [UpdateAsset] {
    let sql = "SELECT * FROM assets;"
    let rows = try execute(sql: sql, withArgs: nil)
    return rows.map { row in
      asset(withRow: row)
    }
  }

  public func assets(withUpdateId updateId: UUID) throws -> [UpdateAsset] {
    let sql = "SELECT assets.*, launch_asset_id FROM assets INNER JOIN updates_assets ON updates_assets.asset_id = assets.id INNER JOIN updates ON updates_assets.update_id = updates.id WHERE updates.id = ?1;"
    let rows = try execute(sql: sql, withArgs: [updateId])
    return rows.map { row in
      asset(withRow: row)
    }
  }

  public func asset(withKey key: String?) throws -> UpdateAsset? {
    guard let key = key else {
      return nil
    }

    let sql = """
      SELECT * FROM assets WHERE "key" = ?1 LIMIT 1;
    """

    let rows = try execute(sql: sql, withArgs: [key])
    if rows.isEmpty {
      return nil
    }
    return asset(withRow: rows.first!)
  }

  private func jsonData(withKey key: JSONDataKey, scopeKey: String) throws -> [String: Any]? {
    let sql = """
      SELECT * FROM json_data WHERE "key" = ?1 AND "scope_key" = ?2
    """
    let rows = try execute(sql: sql, withArgs: [key.rawValue, scopeKey])
    guard let firstRow = rows.first,
      let value = firstRow["value"] as? String else {
      return nil
    }

    return try JSONSerialization.jsonObject(with: value.data(using: .utf8)!) as? [String: Any]
  }

  private func setJsonData(_ data: [String: Any], withKey key: JSONDataKey, scopeKey: String, isInTransaction: Bool) throws {
    if !isInTransaction {
      sqlite3_exec(db, "BEGIN;", nil, nil, nil)
    }

    let deleteSql = """
      DELETE FROM json_data WHERE "key" = ?1 AND "scope_key" = ?2;
    """
    do {
      _ = try execute(sql: deleteSql, withArgs: [key.rawValue, scopeKey])
    } catch {
      if !isInTransaction {
        sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
      }
      throw UpdatesDatabaseError.setJsonDataError(cause: error)
    }

    let insertSql = """
      INSERT INTO json_data ("key", "value", "last_updated", "scope_key") VALUES (?1, ?2, ?3, ?4);
    """
    do {
      _ = try execute(sql: insertSql, withArgs: [key.rawValue, data, Date().timeIntervalSince1970 * 1000, scopeKey])
    } catch {
      if !isInTransaction {
        sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
      }
      throw UpdatesDatabaseError.setJsonDataError(cause: error)
    }

    if !isInTransaction {
      sqlite3_exec(db, "COMMIT;", nil, nil, nil)
    }
  }

  internal func deleteJsonDataForAllScopeKeys(withKeys keys: [JSONDataKey]) throws {
    sqlite3_exec(db, "BEGIN;", nil, nil, nil)
    let deleteSql = """
      DELETE FROM json_data WHERE "keys" IN (?1);
    """
    let keysArg = keys.map { $0.rawValue }.joined(separator: ",")
    do {
      _ = try execute(sql: deleteSql, withArgs: [keysArg])
    } catch {
      sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
      throw UpdatesDatabaseError.setJsonDataError(cause: error)
    }
    sqlite3_exec(db, "COMMIT;", nil, nil, nil)
  }

  public func serverDefinedHeaders(withScopeKey scopeKey: String) throws -> [String: Any]? {
    return try jsonData(withKey: JSONDataKey.ServerDefinedHeadersKey, scopeKey: scopeKey)
  }

  public func manifestFilters(withScopeKey scopeKey: String) throws -> [String: Any]? {
    return try jsonData(withKey: JSONDataKey.ManifestFiltersKey, scopeKey: scopeKey)
  }

  public func staticBuildData(withScopeKey scopeKey: String) throws -> [String: Any]? {
    return try jsonData(withKey: JSONDataKey.StaticBuildDataKey, scopeKey: scopeKey)
  }

  public func extraParams(withScopeKey scopeKey: String) throws -> [String: String]? {
    return try jsonData(withKey: JSONDataKey.ExtraParmasKey, scopeKey: scopeKey) as? [String: String]
  }

  public func setServerDefinedHeaders(_ serverDefinedHeaders: [String: Any], withScopeKey scopeKey: String) throws {
    return try setJsonData(serverDefinedHeaders, withKey: JSONDataKey.ServerDefinedHeadersKey, scopeKey: scopeKey, isInTransaction: false)
  }

  public func setManifestFilters(_ manifestFilters: [String: Any], withScopeKey scopeKey: String) throws {
    return try setJsonData(manifestFilters, withKey: JSONDataKey.ManifestFiltersKey, scopeKey: scopeKey, isInTransaction: false)
  }

  public func setStaticBuildData(_ staticBuildData: [String: Any], withScopeKey scopeKey: String) throws {
    return try setJsonData(staticBuildData, withKey: JSONDataKey.StaticBuildDataKey, scopeKey: scopeKey, isInTransaction: false)
  }

  public func setExtraParam(key: String, value: String?, withScopeKey scopeKey: String) throws {
    sqlite3_exec(db, "BEGIN;", nil, nil, nil)

    do {
      var extraParamsToWrite = try extraParams(withScopeKey: scopeKey) ?? [:]
      if let value = value {
        extraParamsToWrite[key] = value
      } else {
        extraParamsToWrite.removeValue(forKey: key)
      }

      // ensure that this can be serialized to a structured-header dictionary
      // this will throw for invalid values
      _ = try StringDictionary(value: extraParamsToWrite.mapValues({ value in
        try StringItem(value: value)
      }))

      _ = try setJsonData(extraParamsToWrite, withKey: JSONDataKey.ExtraParmasKey, scopeKey: scopeKey, isInTransaction: true)
    } catch {
      sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
      throw error
    }

    sqlite3_exec(db, "COMMIT;", nil, nil, nil)
  }

  internal func setMetadata(withResponseHeaderData responseHeaderData: ResponseHeaderData, scopeKey: String) throws {
    sqlite3_exec(db, "BEGIN;", nil, nil, nil)

    if let serverDefinedHeaders = responseHeaderData.serverDefinedHeaders {
      do {
        _ = try setJsonData(serverDefinedHeaders, withKey: JSONDataKey.ServerDefinedHeadersKey, scopeKey: scopeKey, isInTransaction: true)
      } catch {
        sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
        throw UpdatesDatabaseError.setJsonDataError(cause: error)
      }
    }

    if let manifestFilters = responseHeaderData.manifestFilters {
      do {
        _ = try setJsonData(manifestFilters, withKey: JSONDataKey.ManifestFiltersKey, scopeKey: scopeKey, isInTransaction: true)
      } catch {
        sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
        throw UpdatesDatabaseError.setJsonDataError(cause: error)
      }
    }

    sqlite3_exec(db, "COMMIT;", nil, nil, nil)
  }

  private func update(withRow row: [String: Any?], config: UpdatesConfig) -> Update {
    let rowManifest: String = row.requiredValue(forKey: "manifest")
    let manifest = (try? JSONSerialization.jsonObject(with: rowManifest.data(using: .utf8)!) as? [String: Any]).require("Update manifest should be a valid JSON object")
    let keep: NSNumber = row.requiredValue(forKey: "keep")
    let status: NSNumber = row.requiredValue(forKey: "status")
    let successfulLaunchCount: NSNumber = row.requiredValue(forKey: "successful_launch_count")
    let failedLaunchCount: NSNumber = row.requiredValue(forKey: "failed_launch_count")
    let url = row.optionalValue(forKey: "url").flatMap(URL.init(string:))
    let requestHeaders: [String: String]? = Self.decodeRequestHeaders(row.optionalValue(forKey: "headers"))

    let update = Update(
      manifest: ManifestFactory.manifest(forManifestJSON: manifest),
      config: config,
      database: self,
      updateId: row.requiredValue(forKey: "id"),
      scopeKey: row.requiredValue(forKey: "scope_key"),
      commitTime: UpdatesDatabaseUtils.date(fromUnixTimeMilliseconds: row.requiredValue(forKey: "commit_time")),
      runtimeVersion: row.requiredValue(forKey: "runtime_version"),
      keep: keep.intValue != 0,
      status: UpdateStatus.init(rawValue: status.intValue)!,
      isDevelopmentMode: false,
      assetsFromManifest: nil,
      url: url,
      requestHeaders: requestHeaders
    )
    update.lastAccessed = UpdatesDatabaseUtils.date(fromUnixTimeMilliseconds: row.requiredValue(forKey: "last_accessed"))
    update.successfulLaunchCount = successfulLaunchCount.intValue
    update.failedLaunchCount = failedLaunchCount.intValue
    return update
  }

  private func asset(withRow row: [String: Any?]) -> UpdateAsset {
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
    let asset = UpdateAsset(key: key, type: row.optionalValue(forKey: "type"))
    asset.assetId = assetId.intValue
    asset.url = url
    asset.extraRequestHeaders = extraRequestHeaders
    asset.downloadTime = UpdatesDatabaseUtils.date(fromUnixTimeMilliseconds: row.requiredValue(forKey: "download_time"))
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

  internal static func encodeRequestHeaders(_ requestHeader: [String: String]) -> String? {
    let encoder = JSONEncoder()
    guard let data = try? encoder.encode(requestHeader) else {
      return nil
    }
    return String(data: data, encoding: .utf8)
  }

  internal static func decodeRequestHeaders(_ jsonString: String?) -> [String: String]? {
    guard let data = jsonString?.data(using: .utf8) else {
      return nil
    }
    let decoder = JSONDecoder()
    return try? decoder.decode([String: String].self, from: data)
  }
}

// swiftlint:enable legacy_objc_type
// swiftlint:enable line_length
// swiftlint:enable force_unwrapping
// swiftlint:enable identifier_name
