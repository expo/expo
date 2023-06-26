// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXDefines.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXTaskManagerInterface.h>

#import <ABI49_0_0EXBackgroundFetch/ABI49_0_0EXBackgroundFetch.h>
#import <ABI49_0_0EXBackgroundFetch/ABI49_0_0EXBackgroundFetchTaskConsumer.h>

@interface ABI49_0_0EXBackgroundFetch ()

@property (nonatomic, weak) id<ABI49_0_0EXTaskManagerInterface> taskManager;

@end

@implementation ABI49_0_0EXBackgroundFetch

ABI49_0_0EX_EXPORT_MODULE(ExpoBackgroundFetch);

- (void)setModuleRegistry:(ABI49_0_0EXModuleRegistry *)moduleRegistry
{
  _taskManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI49_0_0EXTaskManagerInterface)];
}

ABI49_0_0EX_EXPORT_METHOD_AS(getStatusAsync,
                    getStatus:(ABI49_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI49_0_0EXPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    resolve(@([self _getStatus]));
  });
}

ABI49_0_0EX_EXPORT_METHOD_AS(setMinimumIntervalAsync,
                    setMinimumInterval:(nonnull NSNumber *)minimumInterval
                    resolve:(ABI49_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI49_0_0EXPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSTimeInterval timeInterval = [minimumInterval doubleValue];
    [[UIApplication sharedApplication] setMinimumBackgroundFetchInterval:timeInterval];
    resolve(nil);
  });
}

ABI49_0_0EX_EXPORT_METHOD_AS(registerTaskAsync,
                    registerTaskWithName:(nonnull NSString *)taskName
                    options:(nullable NSDictionary *)options
                    resolve:(ABI49_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI49_0_0EXPromiseRejectBlock)reject)
{
  if (![_taskManager hasBackgroundModeEnabled:@"fetch"]) {
    return reject(
                  @"E_BACKGROUND_FETCH_DISABLED",
                  @"Background Fetch has not been configured. To enable it, add `fetch` to `UIBackgroundModes` in the application's Info.plist file.",
                  nil
                  );
  }

  @try {
    [_taskManager registerTaskWithName:taskName
                              consumer:ABI49_0_0EXBackgroundFetchTaskConsumer.class
                               options:options];
  }
  @catch (NSException *e) {
    return reject(e.name, e.reason, nil);
  }
  resolve(nil);
}

ABI49_0_0EX_EXPORT_METHOD_AS(unregisterTaskAsync,
                    unregisterTaskWithName:(nonnull NSString *)taskName
                    resolve:(ABI49_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI49_0_0EXPromiseRejectBlock)reject)
{
  @try {
    [_taskManager unregisterTaskWithName:taskName consumerClass:[ABI49_0_0EXBackgroundFetchTaskConsumer class]];
  } @catch (NSException *e) {
    return reject(e.name, e.reason, nil);
  }
  resolve(nil);
}

# pragma mark - helpers

- (ABI49_0_0EXBackgroundFetchStatus)_getStatus
{
  UIBackgroundRefreshStatus refreshStatus = [[UIApplication sharedApplication] backgroundRefreshStatus];

  switch (refreshStatus) {
    case UIBackgroundRefreshStatusRestricted:
      return ABI49_0_0EXBackgroundFetchStatusRestricted;
    case UIBackgroundRefreshStatusDenied:
      return ABI49_0_0EXBackgroundFetchStatusDenied;
    case UIBackgroundRefreshStatusAvailable:
      return ABI49_0_0EXBackgroundFetchStatusAvailable;
  }
}

@end
