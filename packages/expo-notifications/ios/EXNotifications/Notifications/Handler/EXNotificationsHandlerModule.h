// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXEventEmitter.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>

#import <EXNotifications/EXNotificationsDelegate.h>
#import <EXNotifications/EXSingleNotificationHandlerTask.h>

@interface EXNotificationsHandlerModule : EXExportedModule <EXEventEmitter, EXModuleRegistryConsumer, EXNotificationsDelegate, EXSingleNotificationHandlerTaskDelegate>

@end
