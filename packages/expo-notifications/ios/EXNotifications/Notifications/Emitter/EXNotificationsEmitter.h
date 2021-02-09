// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMEventEmitter.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <UMCore/UMEventEmitterService.h>

#import <EXNotifications/EXNotificationsDelegate.h>

static NSString * const onDidReceiveNotification = @"onDidReceiveNotification";
static NSString * const onDidReceiveNotificationResponse = @"onDidReceiveNotificationResponse";

@interface EXNotificationsEmitter : UMExportedModule <UMEventEmitter, UMModuleRegistryConsumer, EXNotificationsDelegate>

@property (nonatomic, weak, readonly) id<UMEventEmitterService> eventEmitter;

@end
