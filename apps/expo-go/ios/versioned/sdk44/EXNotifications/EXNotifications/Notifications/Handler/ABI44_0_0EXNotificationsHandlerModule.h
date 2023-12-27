// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXEventEmitter.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>

#import <ABI44_0_0EXNotifications/ABI44_0_0EXNotificationsDelegate.h>
#import <ABI44_0_0EXNotifications/ABI44_0_0EXSingleNotificationHandlerTask.h>

@interface ABI44_0_0EXNotificationsHandlerModule : ABI44_0_0EXExportedModule <ABI44_0_0EXEventEmitter, ABI44_0_0EXModuleRegistryConsumer, ABI44_0_0EXNotificationsDelegate, ABI44_0_0EXSingleNotificationHandlerTaskDelegate>

@end
