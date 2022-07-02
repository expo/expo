//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXEventEmitter.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXExportedModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryConsumer.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXAppLifecycleListener.h>
#import <ABI45_0_0EXScreenOrientation/ABI45_0_0EXScreenOrientationRegistry.h>

@interface ABI45_0_0EXScreenOrientationModule : ABI45_0_0EXExportedModule <ABI45_0_0EXModuleRegistryConsumer, ABI45_0_0EXEventEmitter, ABI45_0_0EXAppLifecycleListener, ABI45_0_0EXOrientationListener>

@end
