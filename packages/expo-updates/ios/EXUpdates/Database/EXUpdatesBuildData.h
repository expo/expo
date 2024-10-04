//  Copyright © 2021 650 Industries. All rights reserved.

@class EXUpdatesConfig;
@class EXUpdatesDatabase;

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesBuildData : NSObject

+ (void)ensureBuildDataIsConsistentAsync:(EXUpdatesDatabase *)database config:(EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
