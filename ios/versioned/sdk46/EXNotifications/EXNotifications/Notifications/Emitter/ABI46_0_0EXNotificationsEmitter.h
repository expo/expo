// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXExportedModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXEventEmitter.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryConsumer.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXEventEmitterService.h>

#import <ABI46_0_0EXNotifications/ABI46_0_0EXNotificationsDelegate.h>

static NSString * const onDidReceiveNotification = @"onDidReceiveNotification";
static NSString * const onDidReceiveNotificationResponse = @"onDidReceiveNotificationResponse";

@interface ABI46_0_0EXNotificationsEmitter : ABI46_0_0EXExportedModule <ABI46_0_0EXEventEmitter, ABI46_0_0EXModuleRegistryConsumer, ABI46_0_0EXNotificationsDelegate>

@property (nonatomic, weak, readonly) id<ABI46_0_0EXEventEmitterService> eventEmitter;

@end
