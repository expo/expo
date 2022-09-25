// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXExportedModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryConsumer.h>
#import <ABI46_0_0EXNotifications/ABI46_0_0EXNotificationsDelegate.h>

@interface ABI46_0_0EXNotificationPresentationModule : ABI46_0_0EXExportedModule <ABI46_0_0EXModuleRegistryConsumer, ABI46_0_0EXNotificationsDelegate>

- (NSArray * _Nonnull)serializeNotifications:(NSArray<UNNotification *> * _Nonnull)notifications;

- (void)dismissNotificationWithIdentifier:(NSString *)identifier resolve:(ABI46_0_0EXPromiseResolveBlock)resolve reject:(ABI46_0_0EXPromiseRejectBlock)reject;

@end
