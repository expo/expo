// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>
#import <ABI42_0_0EXNotifications/ABI42_0_0EXNotificationsDelegate.h>

typedef NS_ENUM(NSUInteger, ABI42_0_0EXBackgroundNotificationResult) {
  ABI42_0_0EXBackgroundNotificationResultNoData = 1,
  ABI42_0_0EXBackgroundNotificationResultNewData = 2,
  ABI42_0_0EXBackgroundNotificationResultFailed = 3,
};

@interface ABI42_0_0EXBackgroundNotificationTasksModule : ABI42_0_0UMExportedModule <ABI42_0_0UMModuleRegistryConsumer>


@end
