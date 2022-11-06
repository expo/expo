// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXExportedModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryConsumer.h>
#import <ABI47_0_0EXNotifications/ABI47_0_0EXNotificationsDelegate.h>

typedef NS_ENUM(NSUInteger, ABI47_0_0EXBackgroundNotificationResult) {
  ABI47_0_0EXBackgroundNotificationResultNoData = 1,
  ABI47_0_0EXBackgroundNotificationResultNewData = 2,
  ABI47_0_0EXBackgroundNotificationResultFailed = 3,
};

@interface ABI47_0_0EXBackgroundNotificationTasksModule : ABI47_0_0EXExportedModule <ABI47_0_0EXModuleRegistryConsumer>


@end
