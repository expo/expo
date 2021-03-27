//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncDatabaseMigrationRegistry.h>

#import <EXUpdates/EXSyncDatabaseMigration4To5.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXSyncDatabaseMigrationRegistry

+ (NSArray<id<EXSyncDatabaseMigration>> *)migrations
{
  // migrations should be added here in the order they should be performed (e.g. oldest first)
  return @[[EXSyncDatabaseMigration4To5 new]];
}

@end

NS_ASSUME_NONNULL_END

