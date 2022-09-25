//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesDatabaseMigrationRegistry.h>

#import <EXUpdates/EXUpdatesDatabaseMigration4To5.h>
#import <EXUpdates/EXUpdatesDatabaseMigration5To6.h>
#import <EXUpdates/EXUpdatesDatabaseMigration6To7.h>
#import <EXUpdates/EXUpdatesDatabaseMigration7To8.h>
#import <EXUpdates/EXUpdatesDatabaseMigration8To9.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesDatabaseMigrationRegistry

+ (NSArray<id<EXUpdatesDatabaseMigration>> *)migrations
{
  // migrations should be added here in the order they should be performed (e.g. oldest first)
  return @[
    [EXUpdatesDatabaseMigration4To5 new],
    [EXUpdatesDatabaseMigration5To6 new],
    [EXUpdatesDatabaseMigration6To7 new],
    [EXUpdatesDatabaseMigration7To8 new],
    [EXUpdatesDatabaseMigration8To9 new]
  ];
}

@end

NS_ASSUME_NONNULL_END
