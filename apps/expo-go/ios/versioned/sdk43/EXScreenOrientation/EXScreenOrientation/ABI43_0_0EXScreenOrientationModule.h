//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXEventEmitter.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXExportedModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXAppLifecycleListener.h>
#import <ABI43_0_0EXScreenOrientation/ABI43_0_0EXScreenOrientationRegistry.h>

@interface ABI43_0_0EXScreenOrientationModule : ABI43_0_0EXExportedModule <ABI43_0_0EXModuleRegistryConsumer, ABI43_0_0EXEventEmitter, ABI43_0_0EXAppLifecycleListener, ABI43_0_0EXOrientationListener>

@end
