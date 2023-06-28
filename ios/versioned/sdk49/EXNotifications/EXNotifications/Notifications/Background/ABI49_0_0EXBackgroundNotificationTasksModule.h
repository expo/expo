// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXExportedModule.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistryConsumer.h>
#import <ABI49_0_0EXNotifications/ABI49_0_0EXNotificationsDelegate.h>

typedef NS_ENUM(NSUInteger, ABI49_0_0EXBackgroundNotificationResult) {
  ABI49_0_0EXBackgroundNotificationResultNoData = 1,
  ABI49_0_0EXBackgroundNotificationResultNewData = 2,
  ABI49_0_0EXBackgroundNotificationResultFailed = 3,
};

@interface ABI49_0_0EXBackgroundNotificationTasksModule : ABI49_0_0EXExportedModule <ABI49_0_0EXModuleRegistryConsumer>


@end
