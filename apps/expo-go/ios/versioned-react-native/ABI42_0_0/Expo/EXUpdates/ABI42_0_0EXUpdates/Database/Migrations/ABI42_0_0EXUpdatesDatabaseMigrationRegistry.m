//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesDatabaseMigrationRegistry.h>

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesDatabaseMigration4To5.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesDatabaseMigration5To6.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI42_0_0EXUpdatesDatabaseMigrationRegistry

+ (NSArray<id<ABI42_0_0EXUpdatesDatabaseMigration>> *)migrations
{
  // migrations should be added here in the order they should be performed (e.g. oldest first)
  return @[
    [ABI42_0_0EXUpdatesDatabaseMigration4To5 new],
    [ABI42_0_0EXUpdatesDatabaseMigration5To6 new]
  ];
}

@end

NS_ASSUME_NONNULL_END

