// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>
#import <ABI42_0_0EXNotifications/ABI42_0_0EXNotificationsDelegate.h>

@interface ABI42_0_0EXNotificationPresentationModule : ABI42_0_0UMExportedModule <ABI42_0_0UMModuleRegistryConsumer, ABI42_0_0EXNotificationsDelegate>

- (NSArray * _Nonnull)serializeNotifications:(NSArray<UNNotification *> * _Nonnull)notifications;

- (void)dismissNotificationWithIdentifier:(NSString *)identifier resolve:(ABI42_0_0UMPromiseResolveBlock)resolve reject:(ABI42_0_0UMPromiseRejectBlock)reject;

@end
