// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXExportedModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXEventEmitter.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>

#import <ABI43_0_0EXNotifications/ABI43_0_0EXNotificationsDelegate.h>
#import <ABI43_0_0EXNotifications/ABI43_0_0EXSingleNotificationHandlerTask.h>

@interface ABI43_0_0EXNotificationsHandlerModule : ABI43_0_0EXExportedModule <ABI43_0_0EXEventEmitter, ABI43_0_0EXModuleRegistryConsumer, ABI43_0_0EXNotificationsDelegate, ABI43_0_0EXSingleNotificationHandlerTaskDelegate>

@end
