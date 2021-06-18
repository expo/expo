// Copyright 2021-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <EXNotifications/EXNotificationsDelegate.h>

typedef NS_ENUM(NSUInteger, EXBackgroundNotificationResult) {
  EXBackgroundNotificationResultNoData = 1,
  EXBackgroundNotificationResultNewData = 2,
  EXBackgroundNotificationResultFailed = 3,
};

@interface EXBackgroundNotificationTasksModule : UMExportedModule <UMModuleRegistryConsumer>


@end
