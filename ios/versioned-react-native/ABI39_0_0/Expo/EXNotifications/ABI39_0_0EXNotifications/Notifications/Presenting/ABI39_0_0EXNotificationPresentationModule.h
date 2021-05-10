// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMCore/ABI39_0_0UMExportedModule.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryConsumer.h>
#import <ABI39_0_0EXNotifications/ABI39_0_0EXNotificationsDelegate.h>

@interface ABI39_0_0EXNotificationPresentationModule : ABI39_0_0UMExportedModule <ABI39_0_0UMModuleRegistryConsumer, ABI39_0_0EXNotificationsDelegate>

- (NSArray * _Nonnull)serializeNotifications:(NSArray<UNNotification *> * _Nonnull)notifications;

@end
