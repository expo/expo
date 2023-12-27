//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesDatabaseMigrationRegistry.h>

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesDatabaseMigration4To5.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesDatabaseMigration5To6.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI43_0_0EXUpdatesDatabaseMigrationRegistry

+ (NSArray<id<ABI43_0_0EXUpdatesDatabaseMigration>> *)migrations
{
  // migrations should be added here in the order they should be performed (e.g. oldest first)
  return @[
    [ABI43_0_0EXUpdatesDatabaseMigration4To5 new],
    [ABI43_0_0EXUpdatesDatabaseMigration5To6 new]
  ];
}

@end

NS_ASSUME_NONNULL_END

