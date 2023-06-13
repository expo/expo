// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXNotifications/ABI47_0_0EXBackgroundNotificationTasksModule.h>
#import <ABI47_0_0EXNotifications/ABI47_0_0EXBackgroundRemoteNotificationConsumer.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXTaskManagerInterface.h>

@interface ABI47_0_0EXBackgroundNotificationTasksModule ()

@property (nonatomic, weak) id<ABI47_0_0EXTaskManagerInterface> taskManager;

@end

@implementation ABI47_0_0EXBackgroundNotificationTasksModule

ABI47_0_0EX_EXPORT_MODULE(ExpoBackgroundNotificationTasksModule);

# pragma mark - ABI47_0_0EXModuleRegistryConsumer

- (void)setModuleRegistry:(ABI47_0_0EXModuleRegistry *)moduleRegistry
{
  _taskManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI47_0_0EXTaskManagerInterface)];
}
# pragma mark - Exported methods

ABI47_0_0EX_EXPORT_METHOD_AS(registerTaskAsync,
                    registerTaskWithName:(nonnull NSString *)taskName
                    resolve:(ABI47_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI47_0_0EXPromiseRejectBlock)reject)
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
                              consumer:ABI47_0_0EXBackgroundRemoteNotificationConsumer.class
                               options:@{}];
  }
  @catch (NSException *e) {
    return reject(e.name, e.reason, nil);
  }
  resolve(nil);
}

ABI47_0_0EX_EXPORT_METHOD_AS(unregisterTaskAsync,
                    unregisterTaskWithName:(nonnull NSString *)taskName
                    resolve:(ABI47_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  @try {
    [_taskManager unregisterTaskWithName:taskName consumerClass:[ABI47_0_0EXBackgroundRemoteNotificationConsumer class]];
  } @catch (NSException *e) {
    return reject(e.name, e.reason, nil);
  }
  resolve(nil);
}

@end
