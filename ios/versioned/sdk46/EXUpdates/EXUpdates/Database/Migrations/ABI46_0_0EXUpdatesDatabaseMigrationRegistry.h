//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesDatabaseMigration.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI46_0_0EXUpdatesDatabaseMigrationRegistry : NSObject

+ (NSArray<id<ABI46_0_0EXUpdatesDatabaseMigration>> *)migrations;

@end

NS_ASSUME_NONNULL_END

