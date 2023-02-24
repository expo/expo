//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesBuildData.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXUpdatesBuildData (Tests)

+ (nullable NSDictionary *)getBuildDataFromConfig:(ABI47_0_0EXUpdatesConfig *)config;
+ (void)clearAllUpdatesAndSetStaticBuildData:(ABI47_0_0EXUpdatesDatabase *)database config:(ABI47_0_0EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
