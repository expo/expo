//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXEventEmitter.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXAppLifecycleListener.h>
#import <ABI44_0_0EXScreenOrientation/ABI44_0_0EXScreenOrientationRegistry.h>

@interface ABI44_0_0EXScreenOrientationModule : ABI44_0_0EXExportedModule <ABI44_0_0EXModuleRegistryConsumer, ABI44_0_0EXEventEmitter, ABI44_0_0EXAppLifecycleListener, ABI44_0_0EXOrientationListener>

@end
