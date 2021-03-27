//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncDatabaseMigration.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSyncDatabaseMigrationRegistry : NSObject

+ (NSArray<id<EXSyncDatabaseMigration>> *)migrations;

@end

NS_ASSUME_NONNULL_END

