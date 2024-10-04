// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXEventEmitter.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>
#import <ExpoModulesCore/EXEventEmitterService.h>

#import <EXNotifications/EXNotificationsDelegate.h>

static NSString * const onDidReceiveNotification = @"onDidReceiveNotification";
static NSString * const onDidReceiveNotificationResponse = @"onDidReceiveNotificationResponse";
static NSString * const onDidClearNotificationResponse = @"onDidClearNotificationResponse";

@interface EXNotificationsEmitter : EXExportedModule <EXEventEmitter, EXModuleRegistryConsumer, EXNotificationsDelegate>

@property (nonatomic, weak, readonly) id<EXEventEmitterService> eventEmitter;

@end
