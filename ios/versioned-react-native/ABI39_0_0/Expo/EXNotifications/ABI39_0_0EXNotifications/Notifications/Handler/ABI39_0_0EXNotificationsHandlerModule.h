// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMCore/ABI39_0_0UMExportedModule.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMEventEmitter.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryConsumer.h>

#import <ABI39_0_0EXNotifications/ABI39_0_0EXNotificationsDelegate.h>
#import <ABI39_0_0EXNotifications/ABI39_0_0EXSingleNotificationHandlerTask.h>

@interface ABI39_0_0EXNotificationsHandlerModule : ABI39_0_0UMExportedModule <ABI39_0_0UMEventEmitter, ABI39_0_0UMModuleRegistryConsumer, ABI39_0_0EXNotificationsDelegate, ABI39_0_0EXSingleNotificationHandlerTaskDelegate>

@end
