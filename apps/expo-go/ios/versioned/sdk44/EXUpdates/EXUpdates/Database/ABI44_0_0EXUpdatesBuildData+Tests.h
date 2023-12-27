//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesBuildData.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0EXUpdatesBuildData (Tests)

+ (nullable NSDictionary *)getBuildDataFromConfig:(ABI44_0_0EXUpdatesConfig *)config;
+ (void)clearAllUpdatesAndSetStaticBuildData:(ABI44_0_0EXUpdatesDatabase *)database config:(ABI44_0_0EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
