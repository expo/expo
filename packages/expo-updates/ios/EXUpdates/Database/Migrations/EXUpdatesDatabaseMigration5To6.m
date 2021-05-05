//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesDatabaseMigration5To6.h>
#import <EXUpdates/EXUpdatesDatabaseUtils.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const EXUpdatesDatabaseV5Filename = @"expo-v5.db";

@implementation EXUpdatesDatabaseMigration5To6

- (NSString *)filename
{
  return EXUpdatesDatabaseV5Filename;
}

- (BOOL)runMigrationOnDatabase:(struct sqlite3 *)db error:(NSError ** _Nullable)error
{
  // https://www.sqlite.org/lang_altertable.html#otheralter
  if (sqlite3_exec(db, "PRAGMA foreign_keys=OFF;", NULL, NULL, NULL) != SQLITE_OK) return NO;
  if (sqlite3_exec(db, "BEGIN;", NULL, NULL, NULL) != SQLITE_OK) return NO;

  if (![self _safeExecOrRollback:db sql:@"CREATE TABLE \"new_updates\" (\
        \"id\"  BLOB UNIQUE,\
        \"scope_key\"  TEXT NOT NULL,\
        \"commit_time\"  INTEGER NOT NULL,\
        \"runtime_version\"  TEXT NOT NULL,\
        \"launch_asset_id\" INTEGER,\
        \"manifest\"  TEXT,\
        \"status\"  INTEGER NOT NULL,\
        \"keep\"  INTEGER NOT NULL,\
        \"last_accessed\"  INTEGER NOT NULL,\
        PRIMARY KEY(\"id\"),\
        FOREIGN KEY(\"launch_asset_id\") REFERENCES \"assets\"(\"id\") ON DELETE CASCADE\
        )"]) return NO;
  // insert current time as lastAccessed date for all existing updates
  long long currentTime = [NSDate date].timeIntervalSince1970 * 1000;
  if (![self _safeExecOrRollback:db
                             sql:@"INSERT INTO `new_updates` (`id`, `scope_key`, `commit_time`, `runtime_version`, `launch_asset_id`, `manifest`, `status`, `keep`, `last_accessed`)\
                                   SELECT `id`, `scope_key`, `commit_time`, `runtime_version`, `launch_asset_id`, `metadata` AS `manifest`, `status`, `keep`, ?1 AS `last_accessed` FROM `updates`"
                            args:@[@(currentTime)]]) return NO;
  if (![self _safeExecOrRollback:db sql:@"DROP TABLE `updates`"]) return NO;
  if (![self _safeExecOrRollback:db sql:@"ALTER TABLE `new_updates` RENAME TO `updates`"]) return NO;
  if (![self _safeExecOrRollback:db sql:@"CREATE UNIQUE INDEX \"index_updates_scope_key_commit_time\" ON \"updates\" (\"scope_key\", \"commit_time\")"]) return NO;
  if (![self _safeExecOrRollback:db sql:@"CREATE INDEX \"index_updates_launch_asset_id\" ON \"updates\" (\"launch_asset_id\")"]) return NO;

  if (sqlite3_exec(db, "COMMIT;", NULL, NULL, NULL) != SQLITE_OK) return NO;
  if (sqlite3_exec(db, "PRAGMA foreign_keys=ON;", NULL, NULL, NULL) != SQLITE_OK) return NO;
  return YES;
}

- (BOOL)_safeExecOrRollback:(struct sqlite3 *)db sql:(NSString *)sql
{
  if (sqlite3_exec(db, sql.UTF8String, NULL, NULL, NULL) != SQLITE_OK) {
    sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
    return NO;
  }
  return YES;
}

- (BOOL)_safeExecOrRollback:(struct sqlite3 *)db sql:(NSString *)sql args:(NSArray *)args
{
  NSError *error;
  NSArray<NSDictionary *> *rows = [EXUpdatesDatabaseUtils executeSql:sql withArgs:args onDatabase:db error:&error];
  if (!rows || error) {
    sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
    return NO;
  }
  return YES;
}

@end

NS_ASSUME_NONNULL_END
