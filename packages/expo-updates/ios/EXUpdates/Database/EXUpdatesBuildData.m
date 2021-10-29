//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesBuildData.h>
#import <EXUpdates/EXUpdatesDatabaseUtils.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesBuildData

+ (void)ensureBuildDataIsConsistent:(EXUpdatesDatabase *)database config:(EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
{
  if (!config.scopeKey) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"expo-updates was configured with no scope key. Make sure a valid URL is configured under EXUpdatesURL."
                                 userInfo:@{}];
  }
  
  __block NSDictionary *staticBuildData;
  __block NSError *loadError;
  dispatch_sync(database.databaseQueue, ^{
    staticBuildData = [database staticBuildDataWithScopeKey:config.scopeKey error:&loadError];
  });
  if (loadError){
    *error = loadError;
    return;
  }
  
  NSError *setBuildDataError;
  NSError *clearAllUpdatesError;
  if(staticBuildData == nil){
    [self setBuildDataInDatabase:database config:config error:&setBuildDataError];
  } else {
    NSDictionary *impliedStaticBuildData = [self getBuildDataFromConfig:config];
    BOOL isConsistent = [staticBuildData isEqualToDictionary:impliedStaticBuildData];
    if (!isConsistent){
      [self clearAllUpdatesFromDatabase:database config:config error:&clearAllUpdatesError];
      if(!clearAllUpdatesError){
        [self setBuildDataInDatabase:database config:config error:&setBuildDataError];
      }
    }
  }
  if (setBuildDataError){
    *error = setBuildDataError;
    return;
  }
  if (clearAllUpdatesError){
    *error = clearAllUpdatesError;
    return;
  }
}

+ (nullable NSDictionary *)getBuildDataFromDatabase:(EXUpdatesDatabase *)database scopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;
{
  NSDictionary *staticBuildData = [database staticBuildDataWithScopeKey:scopeKey error:error];
  return staticBuildData;
}

+ (nullable NSDictionary *)getBuildDataFromConfig:(EXUpdatesConfig *)config;
{
  return @{
    @"EXUpdatesURL":config.updateUrl.absoluteString,
    @"EXUpdatesReleaseChannel":config.releaseChannel,
    @"EXUpdatesRequestHeaders":config.requestHeaders,
  };
}

+ (void)setBuildDataInDatabase:(EXUpdatesDatabase *)database config:(EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
{
  __block NSError *dbError;
  dispatch_async(database.databaseQueue, ^{
    [database setStaticBuildData:[self getBuildDataFromConfig:config] withScopeKey:config.scopeKey error:&dbError];
  });
  if (dbError){
    *error = dbError;
  }
}

+ (void)clearAllUpdatesFromDatabase:(EXUpdatesDatabase *)database
                             config:(EXUpdatesConfig *)config
                              error:(NSError ** _Nullable)error
{
  __block NSError *dbError;
  dispatch_async(database.databaseQueue, ^{
    NSArray<EXUpdatesUpdate *> *allUpdates = [database allUpdatesWithConfig:config error:&dbError];
    if (allUpdates || !dbError) {
      [database deleteUpdates:allUpdates error:&dbError];
    }
  });
  if (dbError){
    *error = dbError;
  }
}

@end

NS_ASSUME_NONNULL_END
