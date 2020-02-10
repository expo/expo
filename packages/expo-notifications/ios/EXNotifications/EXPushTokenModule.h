// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMEventEmitter.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <EXNotifications/EXPushTokenListener.h>

@interface EXPushTokenModule : UMExportedModule <UMEventEmitter, UMModuleRegistryConsumer, EXPushTokenListener>
@end
