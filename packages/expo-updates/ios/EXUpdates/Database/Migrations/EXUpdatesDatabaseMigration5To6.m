//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesDatabaseMigration5To6.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const EXUpdatesDatabaseV5Filename = @"expo-v5.db";

@implementation EXUpdatesDatabaseMigration5To6

- (NSString *)filename
{
  return EXUpdatesDatabaseV5Filename;
}

- (BOOL)runMigrationOnDatabase:(struct sqlite3 *)db error:(NSError ** _Nullable)error
{
  return NO;
}

@end

NS_ASSUME_NONNULL_END
