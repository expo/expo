//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMCore/ABI39_0_0UMEventEmitter.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMExportedModule.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryConsumer.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMAppLifecycleListener.h>
#import <ABI39_0_0EXScreenOrientation/ABI39_0_0EXScreenOrientationRegistry.h>

@interface ABI39_0_0EXScreenOrientationModule : ABI39_0_0UMExportedModule <ABI39_0_0UMModuleRegistryConsumer, ABI39_0_0UMEventEmitter, ABI39_0_0UMAppLifecycleListener, ABI39_0_0EXOrientationListener>

@end
