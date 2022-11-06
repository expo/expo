// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXExportedModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryConsumer.h>
#import <ABI47_0_0EXNotifications/ABI47_0_0EXNotificationsDelegate.h>

@interface ABI47_0_0EXNotificationPresentationModule : ABI47_0_0EXExportedModule <ABI47_0_0EXModuleRegistryConsumer, ABI47_0_0EXNotificationsDelegate>

- (NSArray * _Nonnull)serializeNotifications:(NSArray<UNNotification *> * _Nonnull)notifications;

- (void)dismissNotificationWithIdentifier:(NSString *)identifier resolve:(ABI47_0_0EXPromiseResolveBlock)resolve reject:(ABI47_0_0EXPromiseRejectBlock)reject;

@end
