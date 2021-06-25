//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMEventEmitter.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMAppLifecycleListener.h>
#import <ABI40_0_0EXScreenOrientation/ABI40_0_0EXScreenOrientationRegistry.h>

@interface ABI40_0_0EXScreenOrientationModule : ABI40_0_0UMExportedModule <ABI40_0_0UMModuleRegistryConsumer, ABI40_0_0UMEventEmitter, ABI40_0_0UMAppLifecycleListener, ABI40_0_0EXOrientationListener>

@end
