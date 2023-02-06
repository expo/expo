//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesBuildData.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI48_0_0EXUpdatesBuildData (Tests)

+ (nullable NSDictionary *)getBuildDataFromConfig:(ABI48_0_0EXUpdatesConfig *)config;
+ (void)clearAllUpdatesAndSetStaticBuildData:(ABI48_0_0EXUpdatesDatabase *)database config:(ABI48_0_0EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
