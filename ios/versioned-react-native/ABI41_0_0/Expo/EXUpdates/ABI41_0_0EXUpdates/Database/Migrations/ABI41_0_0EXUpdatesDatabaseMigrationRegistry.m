//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesDatabaseMigrationRegistry.h>

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesDatabaseMigration4To5.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI41_0_0EXUpdatesDatabaseMigrationRegistry

+ (NSArray<id<ABI41_0_0EXUpdatesDatabaseMigration>> *)migrations
{
  // migrations should be added here in the order they should be performed (e.g. oldest first)
  return @[[ABI41_0_0EXUpdatesDatabaseMigration4To5 new]];
}

@end

NS_ASSUME_NONNULL_END

