// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXExportedModule.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXEventEmitter.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistryConsumer.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXEventEmitterService.h>

#import <ABI49_0_0EXNotifications/ABI49_0_0EXNotificationsDelegate.h>

static NSString * const onDidReceiveNotification = @"onDidReceiveNotification";
static NSString * const onDidReceiveNotificationResponse = @"onDidReceiveNotificationResponse";

@interface ABI49_0_0EXNotificationsEmitter : ABI49_0_0EXExportedModule <ABI49_0_0EXEventEmitter, ABI49_0_0EXModuleRegistryConsumer, ABI49_0_0EXNotificationsDelegate>

@property (nonatomic, weak, readonly) id<ABI49_0_0EXEventEmitterService> eventEmitter;

@end
