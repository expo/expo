// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXExportedModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryConsumer.h>
#import <ABI45_0_0EXNotifications/ABI45_0_0EXNotificationsDelegate.h>

typedef NS_ENUM(NSUInteger, ABI45_0_0EXBackgroundNotificationResult) {
  ABI45_0_0EXBackgroundNotificationResultNoData = 1,
  ABI45_0_0EXBackgroundNotificationResultNewData = 2,
  ABI45_0_0EXBackgroundNotificationResultFailed = 3,
};

@interface ABI45_0_0EXBackgroundNotificationTasksModule : ABI45_0_0EXExportedModule <ABI45_0_0EXModuleRegistryConsumer>


@end
