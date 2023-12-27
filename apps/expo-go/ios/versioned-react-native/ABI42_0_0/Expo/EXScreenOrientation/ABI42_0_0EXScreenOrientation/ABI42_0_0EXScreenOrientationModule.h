//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMEventEmitter.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMAppLifecycleListener.h>
#import <ABI42_0_0EXScreenOrientation/ABI42_0_0EXScreenOrientationRegistry.h>

@interface ABI42_0_0EXScreenOrientationModule : ABI42_0_0UMExportedModule <ABI42_0_0UMModuleRegistryConsumer, ABI42_0_0UMEventEmitter, ABI42_0_0UMAppLifecycleListener, ABI42_0_0EXOrientationListener>

@end
