// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMEventEmitter.h>
#import <UMCore/UMModuleRegistryConsumer.h>

#import <EXNotifications/EXNotificationsDelegate.h>
#import <EXNotifications/EXSingleNotificationHandlerTask.h>

@interface EXNotificationsHandlerModule : UMExportedModule <UMEventEmitter, UMModuleRegistryConsumer, EXNotificationsDelegate, EXSingleNotificationHandlerTaskDelegate>

@end
