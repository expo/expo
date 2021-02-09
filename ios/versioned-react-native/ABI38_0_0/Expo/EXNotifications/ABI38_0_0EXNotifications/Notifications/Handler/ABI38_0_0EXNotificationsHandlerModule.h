// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMEventEmitter.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>

#import <ABI38_0_0EXNotifications/ABI38_0_0EXNotificationsDelegate.h>
#import <ABI38_0_0EXNotifications/ABI38_0_0EXSingleNotificationHandlerTask.h>

@interface ABI38_0_0EXNotificationsHandlerModule : ABI38_0_0UMExportedModule <ABI38_0_0UMEventEmitter, ABI38_0_0UMModuleRegistryConsumer, ABI38_0_0EXNotificationsDelegate, ABI38_0_0EXSingleNotificationHandlerTaskDelegate>

@end
