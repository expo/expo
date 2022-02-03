//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXEventEmitter.h>
#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>
#import <ExpoModulesCore/EXAppLifecycleListener.h>
#import <EXScreenOrientation/EXScreenOrientationRegistry.h>

@interface EXScreenOrientationModule : EXExportedModule <EXModuleRegistryConsumer, EXEventEmitter, EXAppLifecycleListener, EXOrientationListener>

@end
