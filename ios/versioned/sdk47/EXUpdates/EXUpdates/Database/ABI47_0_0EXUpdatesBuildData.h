//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesDatabase.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXUpdatesBuildData : NSObject

+ (void)ensureBuildDataIsConsistentAsync:(ABI47_0_0EXUpdatesDatabase *)database config:(ABI47_0_0EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
