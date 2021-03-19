// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMEventEmitter.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMEventEmitterService.h>

#import <ABI41_0_0EXNotifications/ABI41_0_0EXNotificationsDelegate.h>

static NSString * const onDidReceiveNotification = @"onDidReceiveNotification";
static NSString * const onDidReceiveNotificationResponse = @"onDidReceiveNotificationResponse";

@interface ABI41_0_0EXNotificationsEmitter : ABI41_0_0UMExportedModule <ABI41_0_0UMEventEmitter, ABI41_0_0UMModuleRegistryConsumer, ABI41_0_0EXNotificationsDelegate>

@property (nonatomic, weak, readonly) id<ABI41_0_0UMEventEmitterService> eventEmitter;

@end
