//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesDatabase.h>

#import <sqlite3.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesDatabase ()

@property (nonatomic, assign) sqlite3 *db;
@property (nonatomic, readwrite, strong) NSLock *lock;

@end

static NSString * const EXUpdatesDatabaseErrorDomain = @"EXUpdatesDatabase";
static NSString * const EXUpdatesDatabaseFilename = @"expo-v3.db";

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
  sqlite3 *db;
  NSURL *dbUrl = [directory URLByAppendingPathComponent:EXUpdatesDatabaseFilename];
  BOOL shouldInitializeDatabase = ![[NSFileManager defaultManager] fileExistsAtPath:[dbUrl path]];
  int resultCode = sqlite3_open([[dbUrl path] UTF8String], &db);
  if (resultCode != SQLITE_OK) {
    NSLog(@"Error opening SQLite db: %@", [self _errorFromSqlite:_db].localizedDescription);
    sqlite3_close(db);

    if (resultCode == SQLITE_CORRUPT || resultCode == SQLITE_NOTADB) {
      NSString *archivedDbFilename = [NSString stringWithFormat:@"%f-%@", [[NSDate date] timeIntervalSince1970], EXUpdatesDatabaseFilename];
      NSURL *destinationUrl = [directory URLByAppendingPathComponent:archivedDbFilename];
      NSError *err;
      if ([[NSFileManager defaultManager] moveItemAtURL:dbUrl toURL:destinationUrl error:&err]) {
        NSLog(@"Moved corrupt SQLite db to %@", archivedDbFilename);
        if (sqlite3_open([[dbUrl absoluteString] UTF8String], &db) != SQLITE_OK) {
          if (error != nil) {
            *error = [self _errorFromSqlite:_db];
          }
          return NO;
        }
        shouldInitializeDatabase = YES;
      } else {
        NSString *description = [NSString stringWithFormat:@"Could not move existing corrupt database: %@", [err localizedDescription]];
        if (error != nil) {
          *error = [NSError errorWithDomain:EXUpdatesDatabaseErrorDomain
                                       code:1004
                                   userInfo:@{ NSLocalizedDescriptionKey: description, NSUnderlyingErrorKey: err }];
        }
        return NO;
      }
    } else {
      if (error != nil) {
        *error = [self _errorFromSqlite:_db];
      }
      return NO;
    }
  }
  _db = db;

  if (shouldInitializeDatabase) {
    return [self _initializeDatabase:error];
  }
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

- (BOOL)_initializeDatabase:(NSError **)error
{
  NSAssert(_db, @"Missing database handle");
  dispatch_assert_queue(_databaseQueue);

  NSString * const createTableStmts = @"\
   PRAGMA foreign_keys = ON;\
   CREATE TABLE \"updates\" (\
   \"id\"  BLOB UNIQUE,\
   \"scope_key\"  TEXT NOT NULL,\
   \"commit_time\"  INTEGER NOT NULL,\
   \"runtime_version\"  TEXT NOT NULL,\
   \"launch_asset_id\" INTEGER,\
   \"metadata\"  TEXT,\
   \"status\"  INTEGER NOT NULL,\
   \"keep\"  INTEGER NOT NULL,\
   PRIMARY KEY(\"id\"),\
   FOREIGN KEY(\"launch_asset_id\") REFERENCES \"assets\"(\"id\") ON DELETE CASCADE\
   );\
   CREATE TABLE \"assets\" (\
   \"id\"  INTEGER PRIMARY KEY AUTOINCREMENT,\
   \"url\"  TEXT,\
   \"key\"  TEXT NOT NULL UNIQUE,\
   \"headers\"  TEXT,\
   \"type\"  TEXT NOT NULL,\
   \"metadata\"  TEXT,\
   \"download_time\"  INTEGER NOT NULL,\
   \"relative_path\"  TEXT NOT NULL,\
   \"hash\"  BLOB NOT NULL,\
   \"hash_type\"  INTEGER NOT NULL,\
   \"marked_for_deletion\"  INTEGER NOT NULL\
   );\
   CREATE TABLE \"updates_assets\" (\
   \"update_id\"  BLOB NOT NULL,\
   \"asset_id\" INTEGER NOT NULL,\
   FOREIGN KEY(\"update_id\") REFERENCES \"updates\"(\"id\") ON DELETE CASCADE,\
   FOREIGN KEY(\"asset_id\") REFERENCES \"assets\"(\"id\") ON DELETE CASCADE\
   );\
   CREATE UNIQUE INDEX \"index_updates_scope_key_commit_time\" ON \"updates\" (\"scope_key\", \"commit_time\");\
   CREATE INDEX \"index_updates_launch_asset_id\" ON \"updates\" (\"launch_asset_id\");\
   ";

  char *errMsg;
  if (sqlite3_exec(_db, [createTableStmts UTF8String], NULL, NULL, &errMsg) != SQLITE_OK) {
    if (error != nil) {
      *error = [self _errorFromSqlite:_db];
    }
    sqlite3_free(errMsg);
    return NO;
  };
  return YES;
}

# pragma mark - insert and update

- (void)addUpdate:(EXUpdatesUpdate *)update error:(NSError ** _Nullable)error
{
  NSString * const sql = @"INSERT INTO \"updates\" (\"id\", \"scope_key\", \"commit_time\", \"runtime_version\", \"metadata\", \"status\" , \"keep\")\
  VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1);";

  [self _executeSql:sql
           withArgs:@[
                      update.updateId,
                      update.scopeKey,
                      @([update.commitTime timeIntervalSince1970] * 1000),
                      update.runtimeVersion,
                      update.metadata ?: [NSNull null],
                      @(EXUpdatesUpdateStatusPending)
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

    NSString * const assetInsertSql = @"INSERT OR REPLACE INTO \"assets\" (\"key\", \"url\", \"headers\", \"type\", \"metadata\", \"download_time\", \"relative_path\", \"hash\", \"hash_type\", \"marked_for_deletion\")\
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 0);";
    if ([self _executeSql:assetInsertSql
                 withArgs:@[
                          asset.key,
                          asset.url ? asset.url.absoluteString : [NSNull null],
                          asset.headers ?: [NSNull null],
                          asset.type,
                          asset.metadata ?: [NSNull null],
                          @(asset.downloadTime.timeIntervalSince1970 * 1000),
                          asset.filename,
                          asset.contentHash,
                          @(EXUpdatesDatabaseHashTypeSha1)
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

  NSString * const assetUpdateSql = @"UPDATE \"assets\" SET \"headers\" = ?2, \"type\" = ?3, \"metadata\" = ?4, \"download_time\" = ?5, \"relative_path\" = ?6, \"hash\" = ?7, \"url\" = ?8 WHERE \"key\" = ?1;";
  [self _executeSql:assetUpdateSql
           withArgs:@[
                      asset.key,
                      asset.headers ?: [NSNull null],
                      asset.type,
                      asset.metadata ?: [NSNull null],
                      @(asset.downloadTime.timeIntervalSince1970 * 1000),
                      asset.filename,
                      asset.contentHash,
                      asset.url ? asset.url.absoluteString : [NSNull null]
                      ]
              error:error];
}

- (void)mergeAsset:(EXUpdatesAsset *)asset withExistingEntry:(EXUpdatesAsset *)existingAsset error:(NSError ** _Nullable)error
{
  // if the existing entry came from an embedded manifest, it may not have a URL in the database
  if (asset.url && !existingAsset.url) {
    existingAsset.url = asset.url;
    [self updateAsset:existingAsset error:error];
  }
  // all other properties should be overridden by database values
  asset.filename = existingAsset.filename;
  asset.contentHash = existingAsset.contentHash;
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

- (void)setScopeKey:(NSString *)scopeKey onUpdate:(EXUpdatesUpdate *)update error:(NSError ** _Nullable)error
{
  NSString * const updateSql = @"UPDATE updates SET scope_key = ?1 WHERE id = ?2;";
  [self _executeSql:updateSql withArgs:@[scopeKey, update.updateId] error:error];
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
  NSString * const sql = @"SELECT * FROM updates WHERE scope_key = ?1;";
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

- (nullable NSArray<EXUpdatesUpdate *> *)launchableUpdatesWithConfig:(EXUpdatesConfig *)config error:(NSError ** _Nullable)error
{
  NSString *sql = [NSString stringWithFormat:@"SELECT *\
  FROM updates\
  WHERE scope_key = ?1\
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

- (nullable NSArray<EXUpdatesAsset *> *)assetsWithUpdateId:(NSUUID *)updateId error:(NSError ** _Nullable)error
{
  NSString * const sql = @"SELECT assets.id, \"key\", url, type, relative_path, assets.metadata, launch_asset_id\
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

- (nullable EXUpdatesAsset *)assetWithKey:(NSString *)key error:(NSError ** _Nullable)error
{
  NSString * const sql = @"SELECT * FROM assets WHERE \"key\" = ?1 LIMIT 1;";

  NSArray<NSDictionary *> *rows = [self _executeSql:sql withArgs:@[key] error:error];
  if (!rows || ![rows count]) {
    return nil;
  } else {
    return [self _assetWithRow:rows[0]];
  }
}

# pragma mark - helper methods

- (nullable NSArray<NSDictionary *> *)_executeSql:(NSString *)sql withArgs:(nullable NSArray *)args error:(NSError ** _Nullable)error
{
  NSAssert(_db, @"Missing database handle");
  dispatch_assert_queue(_databaseQueue);
  sqlite3_stmt *stmt;
  if (sqlite3_prepare_v2(_db, [sql UTF8String], -1, &stmt, NULL) != SQLITE_OK) {
    if (error != nil) {
      *error = [self _errorFromSqlite:_db];
    }
    return nil;
  }
  if (args) {
    if (![self _bindStatement:stmt withArgs:args]) {
      if (error != nil) {
        *error = [self _errorFromSqlite:_db];
      }
      return nil;
    }
  }

  NSMutableArray *rows = [NSMutableArray arrayWithCapacity:0];
  NSMutableArray *columnNames = [NSMutableArray arrayWithCapacity:0];

  int columnCount = 0;
  BOOL didFetchColumns = NO;
  int result;
  BOOL hasMore = YES;
  BOOL didError = NO;
  while (hasMore) {
    result = sqlite3_step(stmt);
    switch (result) {
      case SQLITE_ROW: {
        if (!didFetchColumns) {
          // get all column names once at the beginning
          columnCount = sqlite3_column_count(stmt);

          for (int i = 0; i < columnCount; i++) {
            [columnNames addObject:[NSString stringWithUTF8String:sqlite3_column_name(stmt, i)]];
          }
          didFetchColumns = YES;
        }
        NSMutableDictionary *entry = [NSMutableDictionary dictionary];
        for (int i = 0; i < columnCount; i++) {
          id columnValue = [self _getValueWithStatement:stmt column:i];
          entry[columnNames[i]] = columnValue;
        }
        [rows addObject:entry];
        break;
      }
      case SQLITE_DONE:
        hasMore = NO;
        break;
      default:
        didError = YES;
        hasMore = NO;
        break;
    }
  }

  if (didError && error != nil) {
    *error = [self _errorFromSqlite:_db];
  }

  sqlite3_finalize(stmt);

  return didError ? nil : rows;
}

- (id)_getValueWithStatement:(sqlite3_stmt *)stmt column:(int)column
{
  int columnType = sqlite3_column_type(stmt, column);
  switch (columnType) {
    case SQLITE_INTEGER:
      return @(sqlite3_column_int64(stmt, column));
    case SQLITE_FLOAT:
      return @(sqlite3_column_double(stmt, column));
    case SQLITE_BLOB:
      NSAssert(sqlite3_column_bytes(stmt, column) == 16, @"SQLite BLOB value should be a valid UUID");
      return [[NSUUID alloc] initWithUUIDBytes:sqlite3_column_blob(stmt, column)];
    case SQLITE_TEXT:
      return [[NSString alloc] initWithBytes:(char *)sqlite3_column_text(stmt, column)
                                      length:sqlite3_column_bytes(stmt, column)
                                    encoding:NSUTF8StringEncoding];
  }
  return [NSNull null];
}

- (BOOL)_bindStatement:(sqlite3_stmt *)stmt withArgs:(NSArray *)args
{
  __block BOOL success = YES;
  [args enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
    if ([obj isKindOfClass:[NSUUID class]]) {
      uuid_t bytes;
      [((NSUUID *)obj) getUUIDBytes:bytes];
      if (sqlite3_bind_blob(stmt, (int)idx + 1, bytes, 16, SQLITE_TRANSIENT) != SQLITE_OK) {
        success = NO;
        *stop = YES;
      }
    } else if ([obj isKindOfClass:[NSNumber class]]) {
      if (sqlite3_bind_int64(stmt, (int)idx + 1, [((NSNumber *)obj) longLongValue]) != SQLITE_OK) {
        success = NO;
        *stop = YES;
      }
    } else if ([obj isKindOfClass:[NSDictionary class]]) {
      NSError *error;
      NSData *jsonData = [NSJSONSerialization dataWithJSONObject:(NSDictionary *)obj options:kNilOptions error:&error];
      if (!error && sqlite3_bind_text(stmt, (int)idx + 1, jsonData.bytes, (int)jsonData.length, SQLITE_TRANSIENT) != SQLITE_OK) {
        success = NO;
        *stop = YES;
      }
    } else if ([obj isKindOfClass:[NSNull class]]) {
      if (sqlite3_bind_null(stmt, (int)idx + 1) != SQLITE_OK) {
        success = NO;
        *stop = YES;
      }
    } else {
      // convert to string
      NSString *string = [obj isKindOfClass:[NSString class]] ? (NSString *)obj : [obj description];
      NSData *data = [string dataUsingEncoding:NSUTF8StringEncoding];
      if (sqlite3_bind_text(stmt, (int)idx + 1, data.bytes, (int)data.length, SQLITE_TRANSIENT) != SQLITE_OK) {
        success = NO;
        *stop = YES;
      }
    }
  }];
  return success;
}

- (NSError *)_errorFromSqlite:(struct sqlite3 *)db
{
  int code = sqlite3_errcode(db);
  int extendedCode = sqlite3_extended_errcode(db);
  NSString *message = [NSString stringWithUTF8String:sqlite3_errmsg(db)];
  return [NSError errorWithDomain:EXUpdatesDatabaseErrorDomain
                              code:extendedCode
                          userInfo:@{NSLocalizedDescriptionKey: [NSString stringWithFormat:@"Error code %i: %@ (extended error code %i)", code, message, extendedCode]}];
}

- (EXUpdatesUpdate *)_updateWithRow:(NSDictionary *)row config:(EXUpdatesConfig *)config
{
  NSError *error;
  id metadata = nil;
  id rowMetadata = row[@"metadata"];
  if ([rowMetadata isKindOfClass:[NSString class]]) {
    metadata = [NSJSONSerialization JSONObjectWithData:[(NSString *)rowMetadata dataUsingEncoding:NSUTF8StringEncoding] options:kNilOptions error:&error];
    NSAssert(!error && metadata && [metadata isKindOfClass:[NSDictionary class]], @"Update metadata should be a valid JSON object");
  }
  EXUpdatesUpdate *update = [EXUpdatesUpdate updateWithId:row[@"id"]
                                                 scopeKey:row[@"scope_key"]
                                               commitTime:[NSDate dateWithTimeIntervalSince1970:[(NSNumber *)row[@"commit_time"] doubleValue] / 1000]
                                           runtimeVersion:row[@"runtime_version"]
                                                 metadata:metadata
                                                   status:(EXUpdatesUpdateStatus)[(NSNumber *)row[@"status"] integerValue]
                                                     keep:[(NSNumber *)row[@"keep"] boolValue]
                                                   config:config
                                                 database:self];
  return update;
}

- (EXUpdatesAsset *)_assetWithRow:(NSDictionary *)row
{
  NSError *error;
  id metadata = nil;
  id rowMetadata = row[@"metadata"];
  if ([rowMetadata isKindOfClass:[NSString class]]) {
    metadata = [NSJSONSerialization JSONObjectWithData:[(NSString *)rowMetadata dataUsingEncoding:NSUTF8StringEncoding] options:kNilOptions error:&error];
    NSAssert(!error && metadata && [metadata isKindOfClass:[NSDictionary class]], @"Asset metadata should be a valid JSON object");
  }

  id launchAssetId = row[@"launch_asset_id"];
  id rowUrl = row[@"url"];
  NSURL *url;
  if (rowUrl && [rowUrl isKindOfClass:[NSString class]]) {
    url = [NSURL URLWithString:rowUrl];
  }

  EXUpdatesAsset *asset = [[EXUpdatesAsset alloc] initWithKey:row[@"key"] type:row[@"type"]];
  asset.url = url;
  asset.downloadTime = [NSDate dateWithTimeIntervalSince1970:([(NSNumber *)row[@"download_time"] doubleValue] / 1000)];
  asset.filename = row[@"relative_path"];
  asset.contentHash = row[@"hash"];
  asset.metadata = metadata;
  asset.isLaunchAsset = (launchAssetId && [launchAssetId isKindOfClass:[NSNumber class]])
    ? [(NSNumber *)launchAssetId isEqualToNumber:(NSNumber *)row[@"id"]]
    : NO;
  return asset;
}

@end

NS_ASSUME_NONNULL_END
