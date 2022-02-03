// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>
#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0EXNotificationSchedulerModule : ABI44_0_0EXExportedModule <ABI44_0_0EXModuleRegistryConsumer>

- (NSArray * _Nonnull)serializeNotificationRequests:(NSArray<UNNotificationRequest *> * _Nonnull) requests;

- (void)cancelNotification:(NSString *)identifier resolve:(ABI44_0_0EXPromiseResolveBlock)resolve rejecting:(ABI44_0_0EXPromiseRejectBlock)reject;

- (void)cancelAllNotificationsWithResolver:(ABI44_0_0EXPromiseResolveBlock)resolve rejecting:(ABI44_0_0EXPromiseRejectBlock)reject;

- (UNNotificationRequest *)buildNotificationRequestWithIdentifier:(NSString *)identifier content:(NSDictionary *)contentInput trigger:(NSDictionary *)triggerInput;

@end

NS_ASSUME_NONNULL_END
