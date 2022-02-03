// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>
#import <ABI44_0_0EXNotifications/ABI44_0_0EXNotificationsDelegate.h>

typedef NS_ENUM(NSUInteger, ABI44_0_0EXBackgroundNotificationResult) {
  ABI44_0_0EXBackgroundNotificationResultNoData = 1,
  ABI44_0_0EXBackgroundNotificationResultNewData = 2,
  ABI44_0_0EXBackgroundNotificationResultFailed = 3,
};

@interface ABI44_0_0EXBackgroundNotificationTasksModule : ABI44_0_0EXExportedModule <ABI44_0_0EXModuleRegistryConsumer>


@end
