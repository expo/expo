// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXExportedModule.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistryConsumer.h>
#import <ABI48_0_0EXNotifications/ABI48_0_0EXNotificationsDelegate.h>

@interface ABI48_0_0EXNotificationPresentationModule : ABI48_0_0EXExportedModule <ABI48_0_0EXModuleRegistryConsumer, ABI48_0_0EXNotificationsDelegate>

- (NSArray * _Nonnull)serializeNotifications:(NSArray<UNNotification *> * _Nonnull)notifications;

- (void)dismissNotificationWithIdentifier:(NSString *)identifier resolve:(ABI48_0_0EXPromiseResolveBlock)resolve reject:(ABI48_0_0EXPromiseRejectBlock)reject;

@end
