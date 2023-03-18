// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXExportedModule.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistryConsumer.h>
#import <ABI48_0_0EXNotifications/ABI48_0_0EXNotificationsDelegate.h>

typedef NS_ENUM(NSUInteger, ABI48_0_0EXBackgroundNotificationResult) {
  ABI48_0_0EXBackgroundNotificationResultNoData = 1,
  ABI48_0_0EXBackgroundNotificationResultNewData = 2,
  ABI48_0_0EXBackgroundNotificationResultFailed = 3,
};

@interface ABI48_0_0EXBackgroundNotificationTasksModule : ABI48_0_0EXExportedModule <ABI48_0_0EXModuleRegistryConsumer>


@end
