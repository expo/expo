// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXExportedModule.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistryConsumer.h>
#import <ABI49_0_0EXNotifications/ABI49_0_0EXNotificationsDelegate.h>

@interface ABI49_0_0EXNotificationPresentationModule : ABI49_0_0EXExportedModule <ABI49_0_0EXModuleRegistryConsumer, ABI49_0_0EXNotificationsDelegate>

- (NSArray * _Nonnull)serializeNotifications:(NSArray<UNNotification *> * _Nonnull)notifications;

- (void)dismissNotificationWithIdentifier:(NSString *)identifier resolve:(ABI49_0_0EXPromiseResolveBlock)resolve reject:(ABI49_0_0EXPromiseRejectBlock)reject;

@end
