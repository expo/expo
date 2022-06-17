//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesDatabase+Tests.h>
#import <EXUpdates/EXUpdatesDatabaseInitialization.h>
#import <EXUpdates/EXUpdatesDatabaseUtils.h>

#import <sqlite3.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesDatabase ()

@property (nonatomic, assign) sqlite3 *db;

@end

static NSString * const EXUpdatesDatabaseManifestFiltersKey = @"manifestFilters";
static NSString * const EXUpdatesDatabaseServerDefinedHeadersKey = @"serverDefinedHeaders";
static NSString * const EXUpdatesDatabaseStaticBuildDataKey = @"staticBuildData";

@implementation EXUpdatesDatabase

# pragma mark - lifecycle

- (instancetype)init
{
  if (self = [super init]) {
    _databaseQueue = dispatch_queue_create("expo.database.DatabaseQueue", DISPATCH_QUEUE_SERIAL);
  }
  return self;
}

- (BOOL)openDatabaseInDirectory:(NSURL *)directory withError:(NSError ** _Nullable)error
{
  dispatch_assert_queue(_databaseQueue);
  sqlite3 *db;
  if (![EXUpdatesDatabaseInitialization initializeDatabaseWithLatestSchemaInDirectory:directory database:&db error:error]) {
    return NO;
  }
  NSAssert(db, @"Database appears to have initialized successfully, but there is no handle");
  _db = db;
  return YES;
}

- (void)closeDatabase
{
  sqlite3_close(_db);
  _db = nil;
}

- (void)dealloc
{
  [self closeDatabase];
}

# pragma mark - insert and update

- (void)addUpdate:(EXUpdatesUpdate *)update error:(NSError ** _Nullable)error
{
  NSString * const sql = @"INSERT INTO \"updates\" (\"id\", \"scope_key\", \"commit_time\", \"runtime_version\", \"manifest\", \"status\" , \"keep\", \"last_accessed\", \"successful_launch_count\", \"failed_launch_count\")\
  VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7, ?8, ?9);";

  [self _executeSql:sql
           withArgs:@[
                      update.updateId,
                      update.scopeKey,
                      update.commitTime,
                      update.runtimeVersion,
                      update.manifestJSON ?: [NSNull null],
                      @(update.status),
                      update.lastAccessed,
                      @(update.successfulLaunchCount),
                      @(update.failedLaunchCount)
                      ]
              error:error];
}

- (void)addNewAssets:(NSArray<EXUpdatesAsset *> *)assets toUpdateWithId:(NSUUID *)updateId error:(NSError ** _Nullable)error
{
  sqlite3_exec(_db, "BEGIN;", NULL, NULL, NULL);

  for (EXUpdatesAsset *asset in assets) {
    NSAssert(asset.downloadTime, @"asset downloadTime should be nonnull");
    NSAssert(asset.filename, @"asset filename should be nonnull");
    NSAssert(asset.contentHash, @"asset contentHash should be nonnull");

    NSString * const assetInsertSql = @"INSERT OR REPLACE INTO \"assets\" (\"key\", \"url\", \"headers\", \"extra_request_headers\", \"type\", \"metadata\", \"download_time\", \"relative_path\", \"hash\", \"hash_type\", \"expected_hash\", \"marked_for_deletion\")\
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 0);";
    if ([self _executeSql:assetInsertSql
                 withArgs:@[
                          asset.key ?: [NSNull null],
                          asset.url ? asset.url.absoluteString : [NSNull null],
                          asset.headers ?: [NSNull null],
                          asset.extraRequestHeaders ?: [NSNull null],
                          asset.type,
                          asset.metadata ?: [NSNull null],
                          asset.downloadTime,
                          asset.filename,
                          asset.contentHash,
                          @(EXUpdatesDatabaseHashTypeSha1),
                          asset.expectedHash ?: [NSNull null],
                          ]
                    error:error] == nil) {
      sqlite3_exec(_db, "ROLLBACK;", NULL, NULL, NULL);
      return;
    }

    // statements must stay in precisely this order for last_insert_rowid() to work correctly
    if (asset.isLaunchAsset) {
      NSString * const updateSql = @"UPDATE updates SET launch_asset_id = last_insert_rowid() WHERE id = ?1;";
      if ([self _executeSql:updateSql withArgs:@[updateId] error:error] == nil) {
        sqlite3_exec(_db, "ROLLBACK;", NULL, NULL, NULL);
        return;
      }
    }

    NSString * const updateInsertSql = @"INSERT OR REPLACE INTO updates_assets (\"update_id\", \"asset_id\") VALUES (?1, last_insert_rowid());";
    if ([self _executeSql:updateInsertSql withArgs:@[updateId] error:error] == nil) {
      sqlite3_exec(_db, "ROLLBACK;", NULL, NULL, NULL);
      return;
    }
  }

  sqlite3_exec(_db, "COMMIT;", NULL, NULL, NULL);
}

- (BOOL)addExistingAsset:(EXUpdatesAsset *)asset toUpdateWithId:(NSUUID *)updateId error:(NSError ** _Nullable)error
{
  if (!asset.key) {
    return NO;
  }

  BOOL success;

  sqlite3_exec(_db, "BEGIN;", NULL, NULL, NULL);
  
  NSString * const assetSelectSql = @"SELECT id FROM assets WHERE \"key\" = ?1 LIMIT 1;";
  NSArray<NSDictionary *> *rows = [self _executeSql:assetSelectSql withArgs:@[asset.key] error:error];
  if (!rows || ![rows count]) {
    success = NO;
  } else {
    NSNumber *assetId = rows[0][@"id"];
    NSString * const insertSql = @"INSERT OR REPLACE INTO updates_assets (\"update_id\", \"asset_id\") VALUES (?1, ?2);";
    if ([self _executeSql:insertSql withArgs:@[updateId, assetId] error:error] == nil) {
      sqlite3_exec(_db, "ROLLBACK;", NULL, NULL, NULL);
      return NO;
    }
    if (asset.isLaunchAsset) {
      NSString * const updateSql = @"UPDATE updates SET launch_asset_id = ?1 WHERE id = ?2;";
      if ([self _executeSql:updateSql withArgs:@[assetId, updateId] error:error] == nil) {
        sqlite3_exec(_db, "ROLLBACK;", NULL, NULL, NULL);
        return NO;
      }
    }
    success = YES;
  }

  sqlite3_exec(_db, "COMMIT;", NULL, NULL, NULL);
  
  return success;
}

- (void)updateAsset:(EXUpdatesAsset *)asset error:(NSError ** _Nullable)error
{
  NSAssert(asset.downloadTime, @"asset downloadTime should be nonnull");
  NSAssert(asset.filename, @"asset filename should be nonnull");
  NSAssert(asset.contentHash, @"asset contentHash should be nonnull");

  NSString * const assetUpdateSql = @"UPDATE \"assets\" SET \"headers\" = ?2, \"extra_request_headers\" = ?3, \"type\" = ?4, \"metadata\" = ?5, \"download_time\" = ?6, \"relative_path\" = ?7, \"hash\" = ?8, \"expected_hash\" = ?9, \"url\" = ?10 WHERE \"key\" = ?1;";
  [self _executeSql:assetUpdateSql
           withArgs:@[
                      asset.key ?: [NSNull null],
                      asset.headers ?: [NSNull null],
                      asset.extraRequestHeaders ?: [NSNull null],
                      asset.type,
                      asset.metadata ?: [NSNull null],
                      asset.downloadTime,
                      asset.filename,
                      asset.contentHash,
                      asset.expectedHash,
                      asset.url ? asset.url.absoluteString : [NSNull null]
                      ]
              error:error];
}

- (void)mergeAsset:(EXUpdatesAsset *)asset withExistingEntry:(EXUpdatesAsset *)existingAsset error:(NSError ** _Nullable)error
{
  // if the existing entry came from an embedded manifest, it may not have a URL in the database
  BOOL shouldUpdate = false;
  if (asset.url && (!existingAsset.url || ![asset.url isEqual:existingAsset.url])) {
    existingAsset.url = asset.url;
    shouldUpdate = true;
  }
  
  if (asset.extraRequestHeaders && (!existingAsset.extraRequestHeaders || ![asset.extraRequestHeaders isEqualToDictionary:existingAsset.extraRequestHeaders])) {
    existingAsset.extraRequestHeaders = asset.extraRequestHeaders;
    shouldUpdate = true;
  }
  
  if (shouldUpdate) {
    [self updateAsset:existingAsset error:error];
  }
  
  // all other properties should be overridden by database values
  asset.filename = existingAsset.filename;
  asset.contentHash = existingAsset.contentHash;
  asset.expectedHash = existingAsset.expectedHash;
  asset.downloadTime = existingAsset.downloadTime;
}

- (void)markUpdateFinished:(EXUpdatesUpdate *)update error:(NSError ** _Nullable)error
{
  if (update.status != EXUpdatesUpdateStatusDevelopment) {
    update.status = EXUpdatesUpdateStatusReady;
  }
  NSString * const updateSql = @"UPDATE updates SET status = ?1, keep = 1 WHERE id = ?2;";
  [self _executeSql:updateSql
           withArgs:@[
                      @(update.status),
                      update.updateId
                      ]
              error:error];
}

- (void)markUpdateAccessed:(EXUpdatesUpdate *)update error:(NSError ** _Nullable)error
{
  update.lastAccessed = [NSDate date];
  NSString * const updateSql = @"UPDATE updates SET last_accessed = ?1 WHERE id = ?2;";
  [self _executeSql:updateSql withArgs:@[update.lastAccessed, update.updateId] error:error];
}

- (void)incrementSuccessfulLaunchCountForUpdate:(EXUpdatesUpdate *)update error:(NSError ** _Nullable)error
{
  update.successfulLaunchCount++;
  NSString * const updateSql = @"UPDATE updates SET successful_launch_count = ?1 WHERE id = ?2;";
  [self _executeSql:updateSql withArgs:@[@(update.successfulLaunchCount), update.updateId] error:error];
}

- (void)incrementFailedLaunchCountForUpdate:(EXUpdatesUpdate *)update error:(NSError ** _Nullable)error
{
  update.failedLaunchCount++;
  NSString * const updateSql = @"UPDATE updates SET failed_launch_count = ?1 WHERE id = ?2;";
  [self _executeSql:updateSql withArgs:@[@(update.failedLaunchCount), update.updateId] error:error];
}

- (void)setScopeKey:(NSString *)scopeKey onUpdate:(EXUpdatesUpdate *)update error:(NSError ** _Nullable)error
{
  NSString * const updateSql = @"UPDATE updates SET scope_key = ?1 WHERE id = ?2;";
  [self _executeSql:updateSql withArgs:@[scopeKey, update.updateId] error:error];
}

- (void)markMissingAssets:(NSArray<EXUpdatesAsset *> *)assets error:(NSError ** _Nullable)error
{
  sqlite3_exec(_db, "BEGIN;", NULL, NULL, NULL);

  NSString * const updatesSql = @"UPDATE updates SET status = ?1 WHERE id IN\
    (SELECT DISTINCT update_id FROM updates_assets WHERE asset_id = ?2);";
  for (EXUpdatesAsset *asset in assets) {
    if ([self _executeSql:updatesSql withArgs:@[@(EXUpdatesUpdateStatusPending), @(asset.assetId)] error:error] == nil) {
      sqlite3_exec(_db, "ROLLBACK;", NULL, NULL, NULL);
      return;
    }
  }

  sqlite3_exec(_db, "COMMIT;", NULL, NULL, NULL);
}

# pragma mark - delete

- (void)deleteUpdates:(NSArray<EXUpdatesUpdate *> *)updates error:(NSError ** _Nullable)error
{
  sqlite3_exec(_db, "BEGIN;", NULL, NULL, NULL);

  NSString * const sql = @"DELETE FROM updates WHERE id = ?1;";
  for (EXUpdatesUpdate *update in updates) {
    if ([self _executeSql:sql withArgs:@[update.updateId] error:error] == nil) {
      sqlite3_exec(_db, "ROLLBACK;", NULL, NULL, NULL);
      return;
    }
  }

  sqlite3_exec(_db, "COMMIT;", NULL, NULL, NULL);
}

- (nullable NSArray<EXUpdatesAsset *> *)deleteUnusedAssetsWithError:(NSError ** _Nullable)error
{
  // the simplest way to mark the assets we want to delete
  // is to mark all assets for deletion, then go back and unmark
  // those assets in updates we want to keep
  // this is safe as long as we do this inside of a transaction

  sqlite3_exec(_db, "BEGIN;", NULL, NULL, NULL);

  NSString * const update1Sql = @"UPDATE assets SET marked_for_deletion = 1;";
  if ([self _executeSql:update1Sql withArgs:nil error:error] == nil) {
    sqlite3_exec(_db, "ROLLBACK;", NULL, NULL, NULL);
    return nil;
  }

  NSString * const update2Sql = @"UPDATE assets SET marked_for_deletion = 0 WHERE id IN (\
  SELECT asset_id \
  FROM updates_assets \
  INNER JOIN updates ON updates_assets.update_id = updates.id\
  WHERE updates.keep = 1\
  );";
  if ([self _executeSql:update2Sql withArgs:nil error:error] == nil) {
    sqlite3_exec(_db, "ROLLBACK;", NULL, NULL, NULL);
    return nil;
  }

  // check for duplicate rows representing a single file on disk
  NSString * const update3Sql = @"UPDATE assets SET marked_for_deletion = 0 WHERE relative_path IN (\
  SELECT relative_path\
  FROM assets\
  WHERE marked_for_deletion = 0\
  );";
  if ([self _executeSql:update3Sql withArgs:nil error:error] == nil) {
    sqlite3_exec(_db, "ROLLBACK;", NULL, NULL, NULL);
    return nil;
  }

  NSString * const selectSql = @"SELECT * FROM assets WHERE marked_for_deletion = 1;";
  NSArray<NSDictionary *> *rows = [self _executeSql:selectSql withArgs:nil error:error];
  if (!rows) {
    sqlite3_exec(_db, "ROLLBACK;", NULL, NULL, NULL);
    return nil;
  }

  NSMutableArray *assets = [NSMutableArray new];
  for (NSDictionary *row in rows) {
    [assets addObject:[self _assetWithRow:row]];
  }

  NSString * const deleteSql = @"DELETE FROM assets WHERE marked_for_deletion = 1;";
  if ([self _executeSql:deleteSql withArgs:nil error:error] == nil) {
    sqlite3_exec(_db, "ROLLBACK;", NULL, NULL, NULL);
    return nil;
  }

  sqlite3_exec(_db, "COMMIT;", NULL, NULL, NULL);

  return assets;
}

# pragma mark - select

- (nullable NSArray<EXUpdatesUpdate *> *)allUpdatesWithConfig:(EXUpdatesConfig *)config error:(NSError ** _Nullable)error
{
  NSString * const sql = @"SELECT * FROM updates;";
  NSArray<NSDictionary *> *rows = [self _executeSql:sql withArgs:nil error:error];
  if (!rows) {
    return nil;
  }

  NSMutableArray<EXUpdatesUpdate *> *launchableUpdates = [NSMutableArray new];
  for (NSDictionary *row in rows) {
    [launchableUpdates addObject:[self _updateWithRow:row config:config]];
  }
  return launchableUpdates;
}

- (nullable NSArray<EXUpdatesUpdate *> *)allUpdatesWithStatus:(EXUpdatesUpdateStatus)status config:(EXUpdatesConfig *)config error:(NSError ** _Nullable)error
{
  NSString * const sql = @"SELECT * FROM updates WHERE status = ?1;";

  NSArray<NSDictionary *> *rows = [self _executeSql:sql withArgs:@[@(status)] error:error];
  if (!rows) {
    return nil;
  }

  NSMutableArray<EXUpdatesUpdate *> *updates = [NSMutableArray new];
  for (NSDictionary *row in rows) {
    [updates addObject:[self _updateWithRow:row config:config]];
  }
  return updates;
}

- (nullable NSArray<NSUUID *> *)allUpdateIdsWithStatus:(EXUpdatesUpdateStatus)status error:(NSError ** _Nullable)error
{
  NSString * const sql = @"SELECT id FROM updates WHERE status = ?1;";

  NSArray<NSDictionary *> *rows = [self _executeSql:sql withArgs:@[@(status)] error:error];
  if (!rows) {
    return nil;
  }

  NSMutableArray<NSUUID *> *ids = [NSMutableArray new];
  for (NSDictionary *row in rows) {
    [ids addObject:row[@"id"]];
  }
  return ids;
}

- (nullable NSArray<EXUpdatesUpdate *> *)launchableUpdatesWithConfig:(EXUpdatesConfig *)config error:(NSError ** _Nullable)error
{
  // if an update has successfully launched at least once, we treat it as launchable
  // even if it has also failed to launch at least once
  NSString *sql = [NSString stringWithFormat:@"SELECT *\
  FROM updates\
  WHERE scope_key = ?1\
  AND (successful_launch_count > 0 OR failed_launch_count < 1)\
  AND status IN (%li, %li, %li);", (long)EXUpdatesUpdateStatusReady, (long)EXUpdatesUpdateStatusEmbedded, (long)EXUpdatesUpdateStatusDevelopment];

  NSArray<NSDictionary *> *rows = [self _executeSql:sql withArgs:@[config.scopeKey] error:error];
  if (!rows) {
    return nil;
  }
  
  NSMutableArray<EXUpdatesUpdate *> *launchableUpdates = [NSMutableArray new];
  for (NSDictionary *row in rows) {
    [launchableUpdates addObject:[self _updateWithRow:row config:config]];
  }
  return launchableUpdates;
}

- (nullable EXUpdatesUpdate *)updateWithId:(NSUUID *)updateId config:(EXUpdatesConfig *)config error:(NSError ** _Nullable)error
{
  NSString * const sql = @"SELECT *\
  FROM updates\
  WHERE updates.id = ?1;";

  NSArray<NSDictionary *> *rows = [self _executeSql:sql withArgs:@[updateId] error:error];
  if (!rows || ![rows count]) {
    return nil;
  } else {
    return [self _updateWithRow:rows[0] config:config];
  }
}

- (nullable NSArray<EXUpdatesAsset *> *)allAssetsWithError:(NSError ** _Nullable)error
{
  NSString * const sql = @"SELECT * FROM assets;";

  NSArray<NSDictionary *> *rows = [self _executeSql:sql withArgs:nil error:error];
  if (!rows) {
    return nil;
  }

  NSMutableArray<EXUpdatesAsset *> *assets = [NSMutableArray arrayWithCapacity:rows.count];

  for (NSDictionary *row in rows) {
    [assets addObject:[self _assetWithRow:row]];
  }

  return assets;
}

- (nullable NSArray<EXUpdatesAsset *> *)assetsWithUpdateId:(NSUUID *)updateId error:(NSError ** _Nullable)error
{
  NSString * const sql = @"SELECT assets.*, launch_asset_id\
  FROM assets\
  INNER JOIN updates_assets ON updates_assets.asset_id = assets.id\
  INNER JOIN updates ON updates_assets.update_id = updates.id\
  WHERE updates.id = ?1;";

  NSArray<NSDictionary *> *rows = [self _executeSql:sql withArgs:@[updateId] error:error];
  if (!rows) {
    return nil;
  }

  NSMutableArray<EXUpdatesAsset *> *assets = [NSMutableArray arrayWithCapacity:rows.count];

  for (NSDictionary *row in rows) {
    [assets addObject:[self _assetWithRow:row]];
  }

  return assets;
}

- (nullable EXUpdatesAsset *)assetWithKey:(nullable NSString *)key error:(NSError ** _Nullable)error
{
  if (!key) {
    return nil;
  }

  NSString * const sql = @"SELECT * FROM assets WHERE \"key\" = ?1 LIMIT 1;";

  NSArray<NSDictionary *> *rows = [self _executeSql:sql withArgs:@[key] error:error];
  if (!rows || ![rows count]) {
    return nil;
  } else {
    return [self _assetWithRow:rows[0]];
  }
}

# pragma mark - json data

- (nullable NSDictionary *)_jsonDataWithKey:(NSString *)key scopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error
{
  NSString * const sql = @"SELECT * FROM json_data WHERE \"key\" = ?1 AND \"scope_key\" = ?2";
  NSArray<NSDictionary *> *rows = [self _executeSql:sql withArgs:@[key, scopeKey] error:error];
  if (rows && [rows count]) {
    id value = rows[0][@"value"];
    if (value && [value isKindOfClass:[NSString class]]) {
      NSDictionary *jsonObject = [NSJSONSerialization JSONObjectWithData:[(NSString *)value dataUsingEncoding:NSUTF8StringEncoding] options:kNilOptions error:error];
      if (!(error && *error) && jsonObject && [jsonObject isKindOfClass:[NSDictionary class]]) {
        return jsonObject;
      }
    }
  }
  return nil;
}

- (BOOL)_setJsonData:(NSDictionary *)data withKey:(NSString *)key scopeKey:(NSString *)scopeKey isInTransaction:(BOOL)isInTransaction error:(NSError ** _Nullable)error
{
  if (!isInTransaction) {
    sqlite3_exec(_db, "BEGIN;", NULL, NULL, NULL);
  }
  NSString * const deleteSql = @"DELETE FROM json_data WHERE \"key\" = ?1 AND \"scope_key\" = ?2";
  if ([self _executeSql:deleteSql withArgs:@[key, scopeKey] error:error] == nil) {
    if (!isInTransaction) {
      sqlite3_exec(_db, "ROLLBACK;", NULL, NULL, NULL);
    }
    return NO;
  }

  NSString * const insertSql = @"INSERT INTO json_data (\"key\", \"value\", \"last_updated\", \"scope_key\") VALUES (?1, ?2, ?3, ?4);";
  if ([self _executeSql:insertSql withArgs:@[key, data, @(NSDate.date.timeIntervalSince1970 * 1000), scopeKey] error:error] == nil) {
    if (!isInTransaction) {
      sqlite3_exec(_db, "ROLLBACK;", NULL, NULL, NULL);
    }
    return NO;
  }
  if (!isInTransaction) {
    sqlite3_exec(_db, "COMMIT;", NULL, NULL, NULL);
  }

  return YES;
}

- (nullable NSDictionary *)serverDefinedHeadersWithScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error
{
  return [self _jsonDataWithKey:EXUpdatesDatabaseServerDefinedHeadersKey scopeKey:scopeKey error:error];
}

- (nullable NSDictionary *)manifestFiltersWithScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error
{
  return [self _jsonDataWithKey:EXUpdatesDatabaseManifestFiltersKey scopeKey:scopeKey error:error];
}

- (nullable NSDictionary *)staticBuildDataWithScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error
{
  return [self _jsonDataWithKey:EXUpdatesDatabaseStaticBuildDataKey scopeKey:scopeKey error:error];
}

- (void)setServerDefinedHeaders:(NSDictionary *)serverDefinedHeaders withScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error
{
  [self _setJsonData:serverDefinedHeaders withKey:EXUpdatesDatabaseServerDefinedHeadersKey scopeKey:scopeKey isInTransaction:NO error:error];
}

- (void)setManifestFilters:(NSDictionary *)manifestFilters withScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error
{
  [self _setJsonData:manifestFilters withKey:EXUpdatesDatabaseManifestFiltersKey scopeKey:scopeKey isInTransaction:NO error:error];
}

- (void)setMetadataWithManifest:(EXUpdatesUpdate *)updateManifest error:(NSError ** _Nullable)error
{
  sqlite3_exec(_db, "BEGIN;", NULL, NULL, NULL);
  if (updateManifest.serverDefinedHeaders) {
    if (![self _setJsonData:updateManifest.serverDefinedHeaders
                   withKey:EXUpdatesDatabaseServerDefinedHeadersKey
                  scopeKey:updateManifest.scopeKey
           isInTransaction:YES
                     error:error]) {
      sqlite3_exec(_db, "ROLLBACK;", NULL, NULL, NULL);
      return;
    }
  }
  if (updateManifest.manifestFilters) {
    if (![self _setJsonData:updateManifest.manifestFilters
                   withKey:EXUpdatesDatabaseManifestFiltersKey
                  scopeKey:updateManifest.scopeKey
           isInTransaction:YES
                     error:error]) {
      sqlite3_exec(_db, "ROLLBACK;", NULL, NULL, NULL);
      return;
    }
  }
  sqlite3_exec(_db, "COMMIT;", NULL, NULL, NULL);
}

- (void)setStaticBuildData:(NSDictionary *)staticBuildData withScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error
{
  [self _setJsonData:staticBuildData withKey:EXUpdatesDatabaseStaticBuildDataKey scopeKey:scopeKey isInTransaction:NO error:error];
}

# pragma mark - helper methods

- (nullable NSArray<NSDictionary *> *)_executeSql:(NSString *)sql withArgs:(nullable NSArray *)args error:(NSError ** _Nullable)error
{
  NSAssert(_db, @"Missing database handle");
  dispatch_assert_queue(_databaseQueue);
  return [EXUpdatesDatabaseUtils executeSql:sql withArgs:args onDatabase:_db error:error];
}

- (NSError *)_errorFromSqlite:(struct sqlite3 *)db
{
  return [EXUpdatesDatabaseUtils errorFromSqlite:db];
}

- (EXUpdatesUpdate *)_updateWithRow:(NSDictionary *)row config:(EXUpdatesConfig *)config
{
  NSError *error;
  id manifest = nil;
  id rowManifest = row[@"manifest"];
  if ([rowManifest isKindOfClass:[NSString class]]) {
    manifest = [NSJSONSerialization JSONObjectWithData:[(NSString *)rowManifest dataUsingEncoding:NSUTF8StringEncoding] options:kNilOptions error:&error];
    NSAssert(!error && manifest && [manifest isKindOfClass:[NSDictionary class]], @"Update manifest should be a valid JSON object");
  }
  EXUpdatesUpdate *update = [EXUpdatesUpdate updateWithId:row[@"id"]
                                                 scopeKey:row[@"scope_key"]
                                               commitTime:[EXUpdatesDatabaseUtils dateFromUnixTimeMilliseconds:(NSNumber *)row[@"commit_time"]]
                                           runtimeVersion:row[@"runtime_version"]
                                                 manifest:manifest
                                                   status:(EXUpdatesUpdateStatus)[(NSNumber *)row[@"status"] integerValue]
                                                     keep:[(NSNumber *)row[@"keep"] boolValue]
                                                   config:config
                                                 database:self];
  update.lastAccessed = [EXUpdatesDatabaseUtils dateFromUnixTimeMilliseconds:(NSNumber *)row[@"last_accessed"]];
  update.successfulLaunchCount = [(NSNumber *)row[@"successful_launch_count"] integerValue];
  update.failedLaunchCount = [(NSNumber *)row[@"failed_launch_count"] integerValue];
  return update;
}

- (EXUpdatesAsset *)_assetWithRow:(NSDictionary *)row
{
  NSError *metadataDeserializationError;
  id metadata = nil;
  id rowMetadata = row[@"metadata"];
  if ([rowMetadata isKindOfClass:[NSString class]]) {
    metadata = [NSJSONSerialization JSONObjectWithData:[(NSString *)rowMetadata dataUsingEncoding:NSUTF8StringEncoding] options:kNilOptions error:&metadataDeserializationError];
    NSAssert(!metadataDeserializationError && metadata && [metadata isKindOfClass:[NSDictionary class]], @"Asset metadata should be a valid JSON object");
  }
  
  NSError *extraRequestHeadersDeserializationError;
  id extraRequestHeaders = nil;
  id rowExtraRequestHeaders = row[@"extra_request_headers"];
  if ([rowExtraRequestHeaders isKindOfClass:[NSString class]]) {
    extraRequestHeaders = [NSJSONSerialization JSONObjectWithData:[(NSString *)rowExtraRequestHeaders dataUsingEncoding:NSUTF8StringEncoding] options:kNilOptions error:&extraRequestHeadersDeserializationError];
    NSAssert(!extraRequestHeadersDeserializationError && extraRequestHeaders && [extraRequestHeaders isKindOfClass:[NSDictionary class]], @"Asset extra_request_headers should be a valid JSON object");
  }

  id launchAssetId = row[@"launch_asset_id"];
  id rowUrl = row[@"url"];
  NSURL *url;
  if (rowUrl && [rowUrl isKindOfClass:[NSString class]]) {
    url = [NSURL URLWithString:rowUrl];
  }
  NSString *key;
  if (row[@"key"] && row[@"key"] != NSNull.null) {
    key = row[@"key"];
  }

  EXUpdatesAsset *asset = [[EXUpdatesAsset alloc] initWithKey:key type:row[@"type"]];
  asset.assetId = [(NSNumber *)row[@"id"] unsignedIntegerValue];
  asset.url = url;
  asset.extraRequestHeaders = extraRequestHeaders;
  asset.downloadTime = [EXUpdatesDatabaseUtils dateFromUnixTimeMilliseconds:(NSNumber *)row[@"download_time"]];
  asset.filename = row[@"relative_path"];
  asset.contentHash = row[@"hash"];
  asset.expectedHash = row[@"expected_hash"];
  asset.metadata = metadata;
  asset.isLaunchAsset = (launchAssetId && [launchAssetId isKindOfClass:[NSNumber class]])
    ? [(NSNumber *)launchAssetId isEqualToNumber:(NSNumber *)row[@"id"]]
    : NO;
  return asset;
}

@end

NS_ASSUME_NONNULL_END
