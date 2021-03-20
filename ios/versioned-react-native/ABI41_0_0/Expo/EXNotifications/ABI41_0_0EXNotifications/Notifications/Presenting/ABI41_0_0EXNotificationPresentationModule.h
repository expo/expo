// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>
#import <ABI41_0_0EXNotifications/ABI41_0_0EXNotificationsDelegate.h>

@interface ABI41_0_0EXNotificationPresentationModule : ABI41_0_0UMExportedModule <ABI41_0_0UMModuleRegistryConsumer, ABI41_0_0EXNotificationsDelegate>

- (NSArray * _Nonnull)serializeNotifications:(NSArray<UNNotification *> * _Nonnull)notifications;

- (void)dismissNotificationWithIdentifier:(NSString *)identifier resolve:(ABI41_0_0UMPromiseResolveBlock)resolve reject:(ABI41_0_0UMPromiseRejectBlock)reject;

@end
