// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXExportedModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryConsumer.h>
#import <ABI46_0_0EXNotifications/ABI46_0_0EXNotificationsDelegate.h>

typedef NS_ENUM(NSUInteger, ABI46_0_0EXBackgroundNotificationResult) {
  ABI46_0_0EXBackgroundNotificationResultNoData = 1,
  ABI46_0_0EXBackgroundNotificationResultNewData = 2,
  ABI46_0_0EXBackgroundNotificationResultFailed = 3,
};

@interface ABI46_0_0EXBackgroundNotificationTasksModule : ABI46_0_0EXExportedModule <ABI46_0_0EXModuleRegistryConsumer>


@end
