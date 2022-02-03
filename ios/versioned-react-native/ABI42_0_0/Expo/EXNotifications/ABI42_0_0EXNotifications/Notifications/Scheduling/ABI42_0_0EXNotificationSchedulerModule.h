// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>
#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXNotificationSchedulerModule : ABI42_0_0UMExportedModule <ABI42_0_0UMModuleRegistryConsumer>

- (NSArray * _Nonnull)serializeNotificationRequests:(NSArray<UNNotificationRequest *> * _Nonnull) requests;

- (void)cancelNotification:(NSString *)identifier resolve:(ABI42_0_0UMPromiseResolveBlock)resolve rejecting:(ABI42_0_0UMPromiseRejectBlock)reject;

- (void)cancelAllNotificationsWithResolver:(ABI42_0_0UMPromiseResolveBlock)resolve rejecting:(ABI42_0_0UMPromiseRejectBlock)reject;

- (UNNotificationRequest *)buildNotificationRequestWithIdentifier:(NSString *)identifier content:(NSDictionary *)contentInput trigger:(NSDictionary *)triggerInput;

@end

NS_ASSUME_NONNULL_END
