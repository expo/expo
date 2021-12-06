//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesDatabaseMigrationRegistry.h>

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesDatabaseMigration4To5.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesDatabaseMigration5To6.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesDatabaseMigration6To7.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI44_0_0EXUpdatesDatabaseMigrationRegistry

+ (NSArray<id<ABI44_0_0EXUpdatesDatabaseMigration>> *)migrations
{
  // migrations should be added here in the order they should be performed (e.g. oldest first)
  return @[
    [ABI44_0_0EXUpdatesDatabaseMigration4To5 new],
    [ABI44_0_0EXUpdatesDatabaseMigration5To6 new],
    [ABI44_0_0EXUpdatesDatabaseMigration6To7 new]
  ];
}

@end

NS_ASSUME_NONNULL_END
