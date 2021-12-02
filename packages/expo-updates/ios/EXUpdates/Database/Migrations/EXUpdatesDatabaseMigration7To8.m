//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesDatabaseMigration7To8.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const EXUpdatesDatabaseV7Filename = @"expo-v7.db";

@implementation EXUpdatesDatabaseMigration7To8

- (NSString *)filename
{
  return EXUpdatesDatabaseV7Filename;
}

- (BOOL)runMigrationOnDatabase:(struct sqlite3 *)db error:(NSError ** _Nullable)error
{
  // https://www.sqlite.org/lang_altertable.html#otheralter
  if (sqlite3_exec(db, "PRAGMA foreign_keys=OFF;", NULL, NULL, NULL) != SQLITE_OK) return NO;
  if (sqlite3_exec(db, "BEGIN;", NULL, NULL, NULL) != SQLITE_OK) return NO;

  if (![self _safeExecOrRollback:db sql:@"ALTER TABLE \"assets\" ADD COLUMN \"extra_request_headers\" TEXT"]) return NO;

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
