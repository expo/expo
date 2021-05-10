//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesDatabaseMigration4To5.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const EXUpdatesDatabaseV4Filename = @"expo-v4.db";

@implementation EXUpdatesDatabaseMigration4To5

- (NSString *)filename
{
  return EXUpdatesDatabaseV4Filename;
}

- (BOOL)runMigrationOnDatabase:(struct sqlite3 *)db error:(NSError ** _Nullable)error
{
  // https://www.sqlite.org/lang_altertable.html#otheralter
  if (sqlite3_exec(db, "PRAGMA foreign_keys=OFF;", NULL, NULL, NULL) != SQLITE_OK) return NO;
  if (sqlite3_exec(db, "BEGIN;", NULL, NULL, NULL) != SQLITE_OK) return NO;

  if (![self _safeExecOrRollback:db sql:@"CREATE TABLE \"new_assets\" (\
        \"id\"  INTEGER PRIMARY KEY AUTOINCREMENT,\
        \"url\"  TEXT,\
        \"key\"  TEXT UNIQUE,\
        \"headers\"  TEXT,\
        \"type\"  TEXT NOT NULL,\
        \"metadata\"  TEXT,\
        \"download_time\"  INTEGER NOT NULL,\
        \"relative_path\"  TEXT NOT NULL,\
        \"hash\"  BLOB NOT NULL,\
        \"hash_type\"  INTEGER NOT NULL,\
        \"marked_for_deletion\"  INTEGER NOT NULL\
        )"]) return NO;
  if (![self _safeExecOrRollback:db sql:@"INSERT INTO `new_assets` (`id`, `url`, `key`, `headers`, `type`, `metadata`, `download_time`, `relative_path`, `hash`, `hash_type`, `marked_for_deletion`)\
        SELECT `id`, `url`, `key`, `headers`, `type`, `metadata`, `download_time`, `relative_path`, `hash`, `hash_type`, `marked_for_deletion` FROM `assets`"]) return NO;
  if (![self _safeExecOrRollback:db sql:@"DROP TABLE `assets`"]) return NO;
  if (![self _safeExecOrRollback:db sql:@"ALTER TABLE `new_assets` RENAME TO `assets`"]) return NO;

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

@end

NS_ASSUME_NONNULL_END
