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
  if (sqlite3_exec(db, @"ALTER TABLE \"assets\" ADD COLUMN \"extra_request_headers\" TEXT".UTF8String, NULL, NULL, NULL) != SQLITE_OK) return NO;
  return YES;
}

@end

NS_ASSUME_NONNULL_END
