// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXExportedModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryConsumer.h>
#import <ABI45_0_0EXNotifications/ABI45_0_0EXNotificationsDelegate.h>

@interface ABI45_0_0EXNotificationPresentationModule : ABI45_0_0EXExportedModule <ABI45_0_0EXModuleRegistryConsumer, ABI45_0_0EXNotificationsDelegate>

- (NSArray * _Nonnull)serializeNotifications:(NSArray<UNNotification *> * _Nonnull)notifications;

- (void)dismissNotificationWithIdentifier:(NSString *)identifier resolve:(ABI45_0_0EXPromiseResolveBlock)resolve reject:(ABI45_0_0EXPromiseRejectBlock)reject;

@end
