// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMCore/ABI39_0_0UMExportedModule.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryConsumer.h>
#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXNotificationSchedulerModule : ABI39_0_0UMExportedModule <ABI39_0_0UMModuleRegistryConsumer>

- (NSArray * _Nonnull)serializeNotificationRequests:(NSArray<UNNotificationRequest *> * _Nonnull) requests;

- (void)cancelNotification:(NSString *)identifier resolve:(ABI39_0_0UMPromiseResolveBlock)resolve rejecting:(ABI39_0_0UMPromiseRejectBlock)reject;

- (void)cancelAllNotificationsWithResolver:(ABI39_0_0UMPromiseResolveBlock)resolve rejecting:(ABI39_0_0UMPromiseRejectBlock)reject;

@end

NS_ASSUME_NONNULL_END
