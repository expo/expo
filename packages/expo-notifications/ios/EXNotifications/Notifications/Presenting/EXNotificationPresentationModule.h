// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>
#import <EXNotifications/EXNotificationsDelegate.h>

@interface EXNotificationPresentationModule : EXExportedModule <EXModuleRegistryConsumer, EXNotificationsDelegate>

- (NSArray * _Nonnull)serializeNotifications:(NSArray<UNNotification *> * _Nonnull)notifications;

- (void)dismissNotificationWithIdentifier:(NSString *)identifier resolve:(EXPromiseResolveBlock)resolve reject:(EXPromiseRejectBlock)reject;

@end
