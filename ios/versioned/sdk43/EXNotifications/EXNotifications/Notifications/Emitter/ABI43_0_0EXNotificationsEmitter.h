// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXExportedModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXEventEmitter.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXEventEmitterService.h>

#import <ABI43_0_0EXNotifications/ABI43_0_0EXNotificationsDelegate.h>

static NSString * const onDidReceiveNotification = @"onDidReceiveNotification";
static NSString * const onDidReceiveNotificationResponse = @"onDidReceiveNotificationResponse";

@interface ABI43_0_0EXNotificationsEmitter : ABI43_0_0EXExportedModule <ABI43_0_0EXEventEmitter, ABI43_0_0EXModuleRegistryConsumer, ABI43_0_0EXNotificationsDelegate>

@property (nonatomic, weak, readonly) id<ABI43_0_0EXEventEmitterService> eventEmitter;

@end
