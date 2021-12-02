//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesBuildData.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesBuildData (Tests)

+ (nullable NSDictionary *)getBuildDataFromConfig:(EXUpdatesConfig *)config;
+ (void)clearAllUpdatesAndSetStaticBuildData:(EXUpdatesDatabase *)database config:(EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
