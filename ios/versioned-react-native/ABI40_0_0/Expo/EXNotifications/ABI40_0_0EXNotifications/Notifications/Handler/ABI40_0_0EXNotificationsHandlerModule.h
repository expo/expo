// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMEventEmitter.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>

#import <ABI40_0_0EXNotifications/ABI40_0_0EXNotificationsDelegate.h>
#import <ABI40_0_0EXNotifications/ABI40_0_0EXSingleNotificationHandlerTask.h>

@interface ABI40_0_0EXNotificationsHandlerModule : ABI40_0_0UMExportedModule <ABI40_0_0UMEventEmitter, ABI40_0_0UMModuleRegistryConsumer, ABI40_0_0EXNotificationsDelegate, ABI40_0_0EXSingleNotificationHandlerTaskDelegate>

@end
