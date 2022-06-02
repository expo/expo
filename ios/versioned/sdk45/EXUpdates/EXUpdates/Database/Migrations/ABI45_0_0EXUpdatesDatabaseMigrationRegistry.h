//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesDatabaseMigration.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI45_0_0EXUpdatesDatabaseMigrationRegistry : NSObject

+ (NSArray<id<ABI45_0_0EXUpdatesDatabaseMigration>> *)migrations;

@end

NS_ASSUME_NONNULL_END

