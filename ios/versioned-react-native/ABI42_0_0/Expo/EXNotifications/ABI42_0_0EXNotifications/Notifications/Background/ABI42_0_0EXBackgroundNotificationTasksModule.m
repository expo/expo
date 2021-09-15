// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXNotifications/ABI42_0_0EXBackgroundNotificationTasksModule.h>
#import <ABI42_0_0EXNotifications/ABI42_0_0EXBackgroundRemoteNotificationConsumer.h>
#import <ABI42_0_0UMTaskManagerInterface/ABI42_0_0UMTaskManagerInterface.h>

@interface ABI42_0_0EXBackgroundNotificationTasksModule ()

@property (nonatomic, weak) id<ABI42_0_0UMTaskManagerInterface> taskManager;

@end

@implementation ABI42_0_0EXBackgroundNotificationTasksModule

ABI42_0_0UM_EXPORT_MODULE(ExpoBackgroundNotificationTasksModule);

# pragma mark - ABI42_0_0UMModuleRegistryConsumer

- (void)setModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry
{
  _taskManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0UMTaskManagerInterface)];
}
# pragma mark - Exported methods

ABI42_0_0UM_EXPORT_METHOD_AS(registerTaskAsync,
                    registerTaskWithName:(nonnull NSString *)taskName
                    resolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  if (![_taskManager hasBackgroundModeEnabled:@"remote-notification"]) {
    return reject(
                  @"E_BACKGROUND_REMOTE_NOTIFICATIONS_DISABLED",
                  @"Background remote notifications have not been configured. To enable it, add `remote-notification` to `UIBackgroundModes` in the application's Info.plist file.",
                  nil
                  );
  }

  @try {
    [_taskManager registerTaskWithName:taskName
                              consumer:ABI42_0_0EXBackgroundRemoteNotificationConsumer.class
                               options:@{}];
  }
  @catch (NSException *e) {
    return reject(e.name, e.reason, nil);
  }
  resolve(nil);
}

ABI42_0_0UM_EXPORT_METHOD_AS(unregisterTaskAsync,
                    unregisterTaskWithName:(nonnull NSString *)taskName
                    resolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  @try {
    [_taskManager unregisterTaskWithName:taskName consumerClass:[ABI42_0_0EXBackgroundRemoteNotificationConsumer class]];
  } @catch (NSException *e) {
    return reject(e.name, e.reason, nil);
  }
  resolve(nil);
}

@end
