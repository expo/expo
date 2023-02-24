// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXExportedModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXEventEmitter.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryConsumer.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXEventEmitterService.h>

#import <ABI47_0_0EXNotifications/ABI47_0_0EXNotificationsDelegate.h>

static NSString * const onDidReceiveNotification = @"onDidReceiveNotification";
static NSString * const onDidReceiveNotificationResponse = @"onDidReceiveNotificationResponse";

@interface ABI47_0_0EXNotificationsEmitter : ABI47_0_0EXExportedModule <ABI47_0_0EXEventEmitter, ABI47_0_0EXModuleRegistryConsumer, ABI47_0_0EXNotificationsDelegate>

@property (nonatomic, weak, readonly) id<ABI47_0_0EXEventEmitterService> eventEmitter;

@end
