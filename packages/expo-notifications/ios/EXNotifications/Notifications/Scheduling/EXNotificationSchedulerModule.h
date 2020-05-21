// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <UserNotifications/UserNotifications.h>

@interface EXNotificationSchedulerModule : UMExportedModule <UMModuleRegistryConsumer>

- (NSArray * _Nonnull)serializeNotificationRequests:(NSArray<UNNotificationRequest *> * _Nonnull) requests;

- (void)cancelNotification:(NSString * _Nonnull)identifier resolve:(UMPromiseResolveBlock _Nonnull)resolve rejecting:(UMPromiseRejectBlock _Nonnull)reject;

- (void)cancelAllNotificationsWithResolver:(UMPromiseResolveBlock _Nonnull)resolve rejecting:(UMPromiseRejectBlock _Nonnull)reject;

@end
