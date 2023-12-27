// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXNotifications/ABI43_0_0EXBackgroundNotificationTasksModule.h>
#import <ABI43_0_0EXNotifications/ABI43_0_0EXBackgroundRemoteNotificationConsumer.h>
#import <ABI43_0_0UMTaskManagerInterface/ABI43_0_0UMTaskManagerInterface.h>

@interface ABI43_0_0EXBackgroundNotificationTasksModule ()

@property (nonatomic, weak) id<ABI43_0_0UMTaskManagerInterface> taskManager;

@end

@implementation ABI43_0_0EXBackgroundNotificationTasksModule

ABI43_0_0EX_EXPORT_MODULE(ExpoBackgroundNotificationTasksModule);

# pragma mark - ABI43_0_0EXModuleRegistryConsumer

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  _taskManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0UMTaskManagerInterface)];
}
# pragma mark - Exported methods

ABI43_0_0EX_EXPORT_METHOD_AS(registerTaskAsync,
                    registerTaskWithName:(nonnull NSString *)taskName
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
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
                              consumer:ABI43_0_0EXBackgroundRemoteNotificationConsumer.class
                               options:@{}];
  }
  @catch (NSException *e) {
    return reject(e.name, e.reason, nil);
  }
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(unregisterTaskAsync,
                    unregisterTaskWithName:(nonnull NSString *)taskName
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  @try {
    [_taskManager unregisterTaskWithName:taskName consumerClass:[ABI43_0_0EXBackgroundRemoteNotificationConsumer class]];
  } @catch (NSException *e) {
    return reject(e.name, e.reason, nil);
  }
  resolve(nil);
}

@end
