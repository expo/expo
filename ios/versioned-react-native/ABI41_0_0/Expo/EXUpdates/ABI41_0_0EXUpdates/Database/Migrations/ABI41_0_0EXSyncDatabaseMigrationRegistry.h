//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncDatabaseMigration.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXSyncDatabaseMigrationRegistry : NSObject

+ (NSArray<id<ABI41_0_0EXSyncDatabaseMigration>> *)migrations;

@end

NS_ASSUME_NONNULL_END

