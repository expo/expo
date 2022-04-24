//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesDatabaseMigrationRegistry.h>

#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesDatabaseMigration4To5.h>
#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesDatabaseMigration5To6.h>
#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesDatabaseMigration6To7.h>
#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesDatabaseMigration7To8.h>
#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesDatabaseMigration8To9.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI45_0_0EXUpdatesDatabaseMigrationRegistry

+ (NSArray<id<ABI45_0_0EXUpdatesDatabaseMigration>> *)migrations
{
  // migrations should be added here in the order they should be performed (e.g. oldest first)
  return @[
    [ABI45_0_0EXUpdatesDatabaseMigration4To5 new],
    [ABI45_0_0EXUpdatesDatabaseMigration5To6 new],
    [ABI45_0_0EXUpdatesDatabaseMigration6To7 new],
    [ABI45_0_0EXUpdatesDatabaseMigration7To8 new],
    [ABI45_0_0EXUpdatesDatabaseMigration8To9 new]
  ];
}

@end

NS_ASSUME_NONNULL_END
