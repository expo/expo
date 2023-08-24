// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXExportedModule.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXEventEmitter.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistryConsumer.h>

#import <ABI49_0_0EXNotifications/ABI49_0_0EXNotificationsDelegate.h>
#import <ABI49_0_0EXNotifications/ABI49_0_0EXSingleNotificationHandlerTask.h>

@interface ABI49_0_0EXNotificationsHandlerModule : ABI49_0_0EXExportedModule <ABI49_0_0EXEventEmitter, ABI49_0_0EXModuleRegistryConsumer, ABI49_0_0EXNotificationsDelegate, ABI49_0_0EXSingleNotificationHandlerTaskDelegate>

@end
