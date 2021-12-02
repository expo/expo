//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesBuildData+Tests.h>
#import <EXUpdates/EXUpdatesDatabaseUtils.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * The build data stored by the configuration is subject to change when
 * a user updates the binary.
 *
 * This can lead to inconsistent update loading behavior, for
 * example: https://github.com/expo/expo/issues/14372
 *
 * This class wipes the updates when any of the tracked build data
 * changes. This leaves the user in the same situation as a fresh install.
 *
 * So far we only know that `releaseChannel` and
 * `requestHeaders[expo-channel-name]` are dangerous to change, but have
 * included a few more that both seem unlikely to change (so we clear
 * the updates cache rarely) and likely to
 * cause bugs when they do. The tracked fields are:
 *
 *   EXUpdatesReleaseChannel
 *   EXUpdatesURL
 *
 * and all of the values in json
 *
 *   EXUpdatesRequestHeaders
 */
@implementation EXUpdatesBuildData

+ (void)ensureBuildDataIsConsistentAsync:(EXUpdatesDatabase *)database
                             config:(EXUpdatesConfig *)config;
{
  dispatch_async(database.databaseQueue, ^{
    if (!config.scopeKey) {
      @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                     reason:@"expo-updates was configured with no scope key. Make sure a valid URL is configured under EXUpdatesURL."
                                   userInfo:@{}];
    }
    
    NSError *getStaticBuildDataError;
    NSDictionary *staticBuildData = [database staticBuildDataWithScopeKey:config.scopeKey error:&getStaticBuildDataError];
    if (getStaticBuildDataError) {
      NSLog(@"Error getting static build data: %@", getStaticBuildDataError);
      return;
    }
    
    if(staticBuildData == nil) {
      NSError *setStaticBuildDataError;
      [database setStaticBuildData:[self getBuildDataFromConfig:config] withScopeKey:config.scopeKey error:&setStaticBuildDataError];
      if (setStaticBuildDataError) {
        NSLog(@"Error setting static build data: %@", setStaticBuildDataError);
      }
    } else {
      NSDictionary *impliedStaticBuildData = [self getBuildDataFromConfig:config];
      BOOL isConsistent = [staticBuildData isEqualToDictionary:impliedStaticBuildData];
      if (!isConsistent) {
        [self clearAllUpdatesAndSetStaticBuildData:database config:config];
      }
    }
  });

}

+ (nullable NSDictionary *)getBuildDataFromConfig:(EXUpdatesConfig *)config;
{
  return @{
    @"EXUpdatesURL": config.updateUrl.absoluteString,
    @"EXUpdatesReleaseChannel": config.releaseChannel,
    @"EXUpdatesRequestHeaders": config.requestHeaders,
  };
}

+ (void)clearAllUpdatesAndSetStaticBuildData:(EXUpdatesDatabase *)database
                             config:(EXUpdatesConfig *)config
{
  NSError *queryError;
  NSArray<EXUpdatesUpdate *> *allUpdates = [database allUpdatesWithConfig:config error:&queryError];
  if (queryError) {
    NSLog(@"Error loading updates from database: %@", queryError);
    return;
  }
  
  NSError *deletionError;
  [database deleteUpdates:allUpdates error:&deletionError];
  if (deletionError) {
    NSLog(@"Error clearing all updates from database: %@", deletionError);
    return;
  }
  
  NSError *setStaticBuildDataError;
  [database setStaticBuildData:[self getBuildDataFromConfig:config] withScopeKey:config.scopeKey error:&setStaticBuildDataError];
  if (setStaticBuildDataError) {
    NSLog(@"Error setting static build data: %@", setStaticBuildDataError);
  }
}

@end

NS_ASSUME_NONNULL_END
