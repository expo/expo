// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXExportedModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXEventEmitter.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryConsumer.h>

#import <ABI46_0_0EXNotifications/ABI46_0_0EXNotificationsDelegate.h>
#import <ABI46_0_0EXNotifications/ABI46_0_0EXSingleNotificationHandlerTask.h>

@interface ABI46_0_0EXNotificationsHandlerModule : ABI46_0_0EXExportedModule <ABI46_0_0EXEventEmitter, ABI46_0_0EXModuleRegistryConsumer, ABI46_0_0EXNotificationsDelegate, ABI46_0_0EXSingleNotificationHandlerTaskDelegate>

@end
