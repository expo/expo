//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesBuildData : NSObject

+ (void)ensureBuildDataIsConsistent:(EXUpdatesDatabase *)database config:(EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
+ (nullable NSDictionary *)getBuildDataFromConfig:(EXUpdatesConfig *)config;
+ (void)clearAllUpdatesFromDatabase:(EXUpdatesDatabase *)database config:(EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
