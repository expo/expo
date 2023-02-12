//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXEventEmitter.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXExportedModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryConsumer.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXAppLifecycleListener.h>
#import <ABI47_0_0EXScreenOrientation/ABI47_0_0EXScreenOrientationRegistry.h>

@interface ABI47_0_0EXScreenOrientationModule : ABI47_0_0EXExportedModule <ABI47_0_0EXModuleRegistryConsumer, ABI47_0_0EXEventEmitter, ABI47_0_0EXAppLifecycleListener, ABI47_0_0EXOrientationListener>

@end
