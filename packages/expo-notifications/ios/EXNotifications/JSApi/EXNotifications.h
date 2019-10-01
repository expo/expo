// Copyright 2016-present 650 Industries. All rights reserved.

#import <UserNotifications/UserNotifications.h>

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <UMCore/UMEventEmitter.h>
#import <EXNotifications/UMNotificationsConsumer.h>
#import <EXNotifications/UMNotificationTokenListener.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXNotifications : UMExportedModule <UMModuleRegistryConsumer, UMEventEmitter, UMNotificationTokenListener, UMNotificationsConsumer>

- (void)registerForPushNotificationsAsync:(UMPromiseResolveBlock)resolve
                                 rejecter:(UMPromiseRejectBlock)reject;

@end

NS_ASSUME_NONNULL_END
