// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>
#import <ABI44_0_0EXNotifications/ABI44_0_0EXNotificationsDelegate.h>

@interface ABI44_0_0EXNotificationPresentationModule : ABI44_0_0EXExportedModule <ABI44_0_0EXModuleRegistryConsumer, ABI44_0_0EXNotificationsDelegate>

- (NSArray * _Nonnull)serializeNotifications:(NSArray<UNNotification *> * _Nonnull)notifications;

- (void)dismissNotificationWithIdentifier:(NSString *)identifier resolve:(ABI44_0_0EXPromiseResolveBlock)resolve reject:(ABI44_0_0EXPromiseRejectBlock)reject;

@end
