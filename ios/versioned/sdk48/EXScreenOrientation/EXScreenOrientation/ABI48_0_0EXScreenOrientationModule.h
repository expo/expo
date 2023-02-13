//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXEventEmitter.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXExportedModule.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistryConsumer.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXAppLifecycleListener.h>
#import <ABI48_0_0EXScreenOrientation/ABI48_0_0EXScreenOrientationRegistry.h>

@interface ABI48_0_0EXScreenOrientationModule : ABI48_0_0EXExportedModule <ABI48_0_0EXModuleRegistryConsumer, ABI48_0_0EXEventEmitter, ABI48_0_0EXAppLifecycleListener, ABI48_0_0EXOrientationListener>

@end
