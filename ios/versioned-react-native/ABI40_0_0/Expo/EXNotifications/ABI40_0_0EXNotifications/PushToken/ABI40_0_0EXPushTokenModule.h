// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMEventEmitter.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>
#import <ABI40_0_0EXNotifications/ABI40_0_0EXPushTokenListener.h>

@interface ABI40_0_0EXPushTokenModule : ABI40_0_0UMExportedModule <ABI40_0_0UMEventEmitter, ABI40_0_0UMModuleRegistryConsumer, ABI40_0_0EXPushTokenListener>
@end
