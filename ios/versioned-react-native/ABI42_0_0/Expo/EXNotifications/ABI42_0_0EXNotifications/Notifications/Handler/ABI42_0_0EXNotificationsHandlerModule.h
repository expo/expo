// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMEventEmitter.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>

#import <ABI42_0_0EXNotifications/ABI42_0_0EXNotificationsDelegate.h>
#import <ABI42_0_0EXNotifications/ABI42_0_0EXSingleNotificationHandlerTask.h>

@interface ABI42_0_0EXNotificationsHandlerModule : ABI42_0_0UMExportedModule <ABI42_0_0UMEventEmitter, ABI42_0_0UMModuleRegistryConsumer, ABI42_0_0EXNotificationsDelegate, ABI42_0_0EXSingleNotificationHandlerTaskDelegate>

@end
