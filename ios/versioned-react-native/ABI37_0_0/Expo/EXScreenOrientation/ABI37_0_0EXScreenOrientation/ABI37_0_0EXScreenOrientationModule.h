//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMCore/ABI37_0_0UMEventEmitter.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMExportedModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryConsumer.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMAppLifecycleListener.h>
#import <ABI37_0_0EXScreenOrientation/ABI37_0_0EXScreenOrientationRegistry.h>

@interface ABI37_0_0EXScreenOrientationModule : ABI37_0_0UMExportedModule <ABI37_0_0UMModuleRegistryConsumer, ABI37_0_0UMEventEmitter, ABI37_0_0UMAppLifecycleListener, ABI37_0_0EXOrientationListener>

@end
