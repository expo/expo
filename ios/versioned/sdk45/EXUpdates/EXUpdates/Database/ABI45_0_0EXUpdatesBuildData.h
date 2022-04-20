//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesDatabase.h>
#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI45_0_0EXUpdatesBuildData : NSObject

+ (void)ensureBuildDataIsConsistentAsync:(ABI45_0_0EXUpdatesDatabase *)database config:(ABI45_0_0EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
