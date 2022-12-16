//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXEventEmitter.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXExportedModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryConsumer.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXAppLifecycleListener.h>
#import <ABI46_0_0EXScreenOrientation/ABI46_0_0EXScreenOrientationRegistry.h>

@interface ABI46_0_0EXScreenOrientationModule : ABI46_0_0EXExportedModule <ABI46_0_0EXModuleRegistryConsumer, ABI46_0_0EXEventEmitter, ABI46_0_0EXAppLifecycleListener, ABI46_0_0EXOrientationListener>

@end
