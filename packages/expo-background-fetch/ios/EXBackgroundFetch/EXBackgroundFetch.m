// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXCore/EXDefines.h>
#import <EXBackgroundFetch/EXBackgroundFetch.h>
#import <EXBackgroundFetch/EXBackgroundFetchConstants.h>
#import <EXBackgroundFetch/EXBackgroundFetchTaskConsumer.h>
#import <EXTaskManagerInterface/EXTaskManagerInterface.h>

// Background Fetch statuses (equivalents to UIBackgroundRefreshStatus)
NSString *const EXBackgroundFetchStatusRestricted = @"restricted";
NSString *const EXBackgroundFetchStatusDenied = @"denied";
NSString *const EXBackgroundFetchStatusAvailable = @"available";

// Possible results (equivalents to UIBackgroundFetchResult)
NSString *const EXBackgroundFetchResultNoData = @"no-data";
NSString *const EXBackgroundFetchResultNewData = @"new-data";
NSString *const EXBackgroundFetchResultFailed = @"failed";

@interface EXBackgroundFetch ()

@property (nonatomic, weak) id<EXTaskManagerInterface> taskManager;

@end

@implementation EXBackgroundFetch

EX_EXPORT_MODULE(ExpoBackgroundFetch);

- (NSDictionary *)constantsToExport
{
  return @{
           @"Status": @{
               @"RESTRICTED": EXBackgroundFetchStatusRestricted,
               @"DENIED": EXBackgroundFetchStatusDenied,
               @"AVAILABLE": EXBackgroundFetchStatusAvailable,
               },
           @"Result": @{
               @"NO_DATA": EXBackgroundFetchResultNoData,
               @"NEW_DATA": EXBackgroundFetchResultNewData,
               @"FAILED": EXBackgroundFetchResultFailed,
               }
           };
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _taskManager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXTaskManagerInterface)];
}

EX_EXPORT_METHOD_AS(getStatusAsync,
                    getStatus:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  resolve([self _getStatus]);
}

EX_EXPORT_METHOD_AS(setMinimumIntervalAsync,
                    setMinimumInterval:(nonnull NSNumber *)minimumInterval
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  NSTimeInterval timeInterval = [minimumInterval doubleValue];
  [[UIApplication sharedApplication] setMinimumBackgroundFetchInterval:timeInterval];
  resolve([NSNull null]);
}

EX_EXPORT_METHOD_AS(registerTaskAsync,
                    registerTaskWithName:(nonnull NSString *)taskName
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if (![_taskManager hasBackgroundModeEnabled:@"fetch"]) {
    return reject(
                  @"E_BACKGROUND_FETCH_DISABLED",
                  @"Background Fetch has not been configured. To enable it, add `fetch` to `UIBackgroundModes` in Info.plist file.",
                  nil
                  );
  }

  @try {
    [_taskManager registerTaskWithName:taskName
                              consumer:EXBackgroundFetchTaskConsumer.class
                               options:@{}];
  }
  @catch (NSException *e) {
    return reject(e.name, e.reason, nil);
  }
  resolve([NSNull null]);
}

EX_EXPORT_METHOD_AS(unregisterTaskAsync,
                    unregisterTaskWithName:(nonnull NSString *)taskName
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  @try {
    [_taskManager unregisterTaskWithName:taskName ofConsumerClass:[EXBackgroundFetchTaskConsumer class]];
  } @catch (NSException *e) {
    return reject(e.name, e.reason, nil);
  }
  resolve([NSNull null]);
}

# pragma mark - helpers

- (nonnull NSString *)_getStatus
{
  UIBackgroundRefreshStatus refreshStatus = [[UIApplication sharedApplication] backgroundRefreshStatus];

  switch (refreshStatus) {
    case UIBackgroundRefreshStatusRestricted:
      return EXBackgroundFetchStatusRestricted;
    case UIBackgroundRefreshStatusDenied:
      return EXBackgroundFetchStatusDenied;
    case UIBackgroundRefreshStatusAvailable:
      return EXBackgroundFetchStatusAvailable;
  }
}

@end
