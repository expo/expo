// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXExportedModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryConsumer.h>
#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI46_0_0EXNotificationSchedulerModule : ABI46_0_0EXExportedModule <ABI46_0_0EXModuleRegistryConsumer>

- (NSArray * _Nonnull)serializeNotificationRequests:(NSArray<UNNotificationRequest *> * _Nonnull) requests;

- (void)cancelNotification:(NSString *)identifier resolve:(ABI46_0_0EXPromiseResolveBlock)resolve rejecting:(ABI46_0_0EXPromiseRejectBlock)reject;

- (void)cancelAllNotificationsWithResolver:(ABI46_0_0EXPromiseResolveBlock)resolve rejecting:(ABI46_0_0EXPromiseRejectBlock)reject;

- (UNNotificationRequest *)buildNotificationRequestWithIdentifier:(NSString *)identifier content:(NSDictionary *)contentInput trigger:(NSDictionary *)triggerInput;

@end

NS_ASSUME_NONNULL_END
