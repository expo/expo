// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>
#import <ABI38_0_0EXNotifications/ABI38_0_0EXNotificationsDelegate.h>

@interface ABI38_0_0EXNotificationPresentationModule : ABI38_0_0UMExportedModule <ABI38_0_0UMModuleRegistryConsumer, ABI38_0_0EXNotificationsDelegate>

- (NSArray * _Nonnull)serializeNotifications:(NSArray<UNNotification *> * _Nonnull)notifications;

@end
