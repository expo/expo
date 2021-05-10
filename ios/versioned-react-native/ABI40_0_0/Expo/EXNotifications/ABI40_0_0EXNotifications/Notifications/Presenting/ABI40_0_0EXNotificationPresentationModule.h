// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>
#import <ABI40_0_0EXNotifications/ABI40_0_0EXNotificationsDelegate.h>

@interface ABI40_0_0EXNotificationPresentationModule : ABI40_0_0UMExportedModule <ABI40_0_0UMModuleRegistryConsumer, ABI40_0_0EXNotificationsDelegate>

- (NSArray * _Nonnull)serializeNotifications:(NSArray<UNNotification *> * _Nonnull)notifications;

@end
