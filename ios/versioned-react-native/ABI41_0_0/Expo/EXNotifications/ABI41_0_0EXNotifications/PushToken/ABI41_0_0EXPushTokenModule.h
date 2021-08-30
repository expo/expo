// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMEventEmitter.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>
#import <ABI41_0_0EXNotifications/ABI41_0_0EXPushTokenListener.h>

@interface ABI41_0_0EXPushTokenModule : ABI41_0_0UMExportedModule <ABI41_0_0UMEventEmitter, ABI41_0_0UMModuleRegistryConsumer, ABI41_0_0EXPushTokenListener>
@end
