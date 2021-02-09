// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>
#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI38_0_0EXNotificationSchedulerModule : ABI38_0_0UMExportedModule <ABI38_0_0UMModuleRegistryConsumer>

- (NSArray * _Nonnull)serializeNotificationRequests:(NSArray<UNNotificationRequest *> * _Nonnull) requests;

- (void)cancelNotification:(NSString *)identifier resolve:(ABI38_0_0UMPromiseResolveBlock)resolve rejecting:(ABI38_0_0UMPromiseRejectBlock)reject;

- (void)cancelAllNotificationsWithResolver:(ABI38_0_0UMPromiseResolveBlock)resolve rejecting:(ABI38_0_0UMPromiseRejectBlock)reject;

@end

NS_ASSUME_NONNULL_END
