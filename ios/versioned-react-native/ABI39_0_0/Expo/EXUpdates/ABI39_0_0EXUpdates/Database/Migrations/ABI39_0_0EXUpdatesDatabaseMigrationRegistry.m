//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesDatabaseMigrationRegistry.h>

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesDatabaseMigration4To5.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesDatabaseMigration5To6.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI39_0_0EXUpdatesDatabaseMigrationRegistry

+ (NSArray<id<ABI39_0_0EXUpdatesDatabaseMigration>> *)migrations
{
  // migrations should be added here in the order they should be performed (e.g. oldest first)
  return @[
    [ABI39_0_0EXUpdatesDatabaseMigration4To5 new],
    [ABI39_0_0EXUpdatesDatabaseMigration5To6 new]
  ];
}

@end

NS_ASSUME_NONNULL_END

