// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/EXBackgroundNotificationTasksModule.h>
#import <EXNotifications/EXBackgroundRemoteNotificationConsumer.h>
#import <UMTaskManagerInterface/UMTaskManagerInterface.h>

@interface EXBackgroundNotificationTasksModule ()

@property (nonatomic, weak) id<UMTaskManagerInterface> taskManager;

@end

@implementation EXBackgroundNotificationTasksModule

UM_EXPORT_MODULE(ExpoBackgroundNotificationTasksModule);

# pragma mark - UMModuleRegistryConsumer

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _taskManager = [moduleRegistry getModuleImplementingProtocol:@protocol(UMTaskManagerInterface)];
}
# pragma mark - Exported methods

UM_EXPORT_METHOD_AS(registerTaskAsync,
                    registerTaskWithName:(nonnull NSString *)taskName
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
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
                              consumer:EXBackgroundRemoteNotificationConsumer.class
                               options:@{}];
  }
  @catch (NSException *e) {
    return reject(e.name, e.reason, nil);
  }
  resolve(nil);
}

UM_EXPORT_METHOD_AS(unregisterTaskAsync,
                    unregisterTaskWithName:(nonnull NSString *)taskName
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  @try {
    [_taskManager unregisterTaskWithName:taskName consumerClass:[EXBackgroundRemoteNotificationConsumer class]];
  } @catch (NSException *e) {
    return reject(e.name, e.reason, nil);
  }
  resolve(nil);
}

@end
