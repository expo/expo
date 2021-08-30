// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMEventEmitter.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMEventEmitterService.h>

#import <ABI42_0_0EXNotifications/ABI42_0_0EXNotificationsDelegate.h>

static NSString * const onDidReceiveNotification = @"onDidReceiveNotification";
static NSString * const onDidReceiveNotificationResponse = @"onDidReceiveNotificationResponse";

@interface ABI42_0_0EXNotificationsEmitter : ABI42_0_0UMExportedModule <ABI42_0_0UMEventEmitter, ABI42_0_0UMModuleRegistryConsumer, ABI42_0_0EXNotificationsDelegate>

@property (nonatomic, weak, readonly) id<ABI42_0_0UMEventEmitterService> eventEmitter;

@end
