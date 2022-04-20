//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesBuildData.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI43_0_0EXUpdatesBuildData (Tests)

+ (nullable NSDictionary *)getBuildDataFromConfig:(ABI43_0_0EXUpdatesConfig *)config;
+ (void)clearAllUpdatesAndSetStaticBuildData:(ABI43_0_0EXUpdatesDatabase *)database config:(ABI43_0_0EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
