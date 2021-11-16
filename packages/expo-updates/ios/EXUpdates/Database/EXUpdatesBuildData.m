//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesBuildData+Tests.h>
#import <EXUpdates/EXUpdatesDatabaseUtils.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesBuildData

+ (void)ensureBuildDataIsConsistent:(EXUpdatesDatabase *)database
                             config:(EXUpdatesConfig *)config;
{
  if (!config.scopeKey) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"expo-updates was configured with no scope key. Make sure a valid URL is configured under EXUpdatesURL."
                                 userInfo:@{}];
  }
  
  NSError *getStaticBuildDataError;
  NSDictionary *staticBuildData = [database staticBuildDataWithScopeKey:config.scopeKey error:&getStaticBuildDataError];
  if (getStaticBuildDataError){
    NSLog(@"Error getting static build data: %@", getStaticBuildDataError);
    return;
  }
  
  if(staticBuildData == nil){
    NSError *setStaticBuildDataError;
    [database setStaticBuildData:[self getBuildDataFromConfig:config] withScopeKey:config.scopeKey error:&setStaticBuildDataError];
    if (setStaticBuildDataError){
      NSLog(@"Error setting static build data: %@", setStaticBuildDataError);
    }
  } else {
    NSDictionary *impliedStaticBuildData = [self getBuildDataFromConfig:config];
    BOOL isConsistent = [staticBuildData isEqualToDictionary:impliedStaticBuildData];
    if (!isConsistent){
      [self clearAllUpdatesFromDatabase:database config:config];
    }
  }
}

+ (nullable NSDictionary *)getBuildDataFromConfig:(EXUpdatesConfig *)config;
{
  return @{
    @"EXUpdatesURL": config.updateUrl.absoluteString,
    @"EXUpdatesReleaseChannel": config.releaseChannel,
    @"EXUpdatesRequestHeaders": config.requestHeaders,
  };
}

+ (void)clearAllUpdatesFromDatabase:(EXUpdatesDatabase *)database
                             config:(EXUpdatesConfig *)config
{
  NSError *queryError;
  NSArray<EXUpdatesUpdate *> *allUpdates = [database allUpdatesWithConfig:config error:&queryError];
  if (queryError){
    NSLog(@"Error loading updates from database: %@", queryError);
    return;
  }
  
  NSError *deletionError;
  [database deleteUpdates:allUpdates error:&deletionError];
  if (deletionError){
    NSLog(@"Error clearing all updates from database: %@", deletionError);
    return;
  }
  
  NSError *setStaticBuildDataError;
  [database setStaticBuildData:[self getBuildDataFromConfig:config] withScopeKey:config.scopeKey error:&setStaticBuildDataError];
  if (setStaticBuildDataError){
    NSLog(@"Error setting static build data: %@", setStaticBuildDataError);
  }
}

@end

NS_ASSUME_NONNULL_END
