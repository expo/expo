//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMEventEmitter.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMAppLifecycleListener.h>
#import <ABI38_0_0EXScreenOrientation/ABI38_0_0EXScreenOrientationRegistry.h>

@interface ABI38_0_0EXScreenOrientationModule : ABI38_0_0UMExportedModule <ABI38_0_0UMModuleRegistryConsumer, ABI38_0_0UMEventEmitter, ABI38_0_0UMAppLifecycleListener, ABI38_0_0EXOrientationListener>

@end
