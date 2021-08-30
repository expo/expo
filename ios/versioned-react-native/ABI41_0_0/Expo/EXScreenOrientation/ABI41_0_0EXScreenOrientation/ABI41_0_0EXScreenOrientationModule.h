//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMEventEmitter.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMAppLifecycleListener.h>
#import <ABI41_0_0EXScreenOrientation/ABI41_0_0EXScreenOrientationRegistry.h>

@interface ABI41_0_0EXScreenOrientationModule : ABI41_0_0UMExportedModule <ABI41_0_0UMModuleRegistryConsumer, ABI41_0_0UMEventEmitter, ABI41_0_0UMAppLifecycleListener, ABI41_0_0EXOrientationListener>

@end
