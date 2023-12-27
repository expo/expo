// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXEventEmitter.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXEventEmitterService.h>

#import <ABI44_0_0EXNotifications/ABI44_0_0EXNotificationsDelegate.h>

static NSString * const onDidReceiveNotification = @"onDidReceiveNotification";
static NSString * const onDidReceiveNotificationResponse = @"onDidReceiveNotificationResponse";

@interface ABI44_0_0EXNotificationsEmitter : ABI44_0_0EXExportedModule <ABI44_0_0EXEventEmitter, ABI44_0_0EXModuleRegistryConsumer, ABI44_0_0EXNotificationsDelegate>

@property (nonatomic, weak, readonly) id<ABI44_0_0EXEventEmitterService> eventEmitter;

@end
