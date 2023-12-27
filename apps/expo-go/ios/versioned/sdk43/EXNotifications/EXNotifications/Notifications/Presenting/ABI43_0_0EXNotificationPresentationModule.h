// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXExportedModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>
#import <ABI43_0_0EXNotifications/ABI43_0_0EXNotificationsDelegate.h>

@interface ABI43_0_0EXNotificationPresentationModule : ABI43_0_0EXExportedModule <ABI43_0_0EXModuleRegistryConsumer, ABI43_0_0EXNotificationsDelegate>

- (NSArray * _Nonnull)serializeNotifications:(NSArray<UNNotification *> * _Nonnull)notifications;

- (void)dismissNotificationWithIdentifier:(NSString *)identifier resolve:(ABI43_0_0EXPromiseResolveBlock)resolve reject:(ABI43_0_0EXPromiseRejectBlock)reject;

@end
