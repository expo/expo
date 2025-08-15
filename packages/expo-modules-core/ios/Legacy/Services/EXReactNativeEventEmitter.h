// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTEventEmitter.h>

#import <ExpoModulesCore/EXInternalModule.h>
#import <ExpoModulesCore/EXEventEmitterService.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>
#import <ExpoModulesCore/EXBridgeModule.h>

// Swift compatibility headers (e.g. `ExpoModulesCore-Swift.h`) are not available in headers,
// so we use class forward declaration here. Swift header must be imported in the `.m` file.
@class EXAppContext;

@interface EXReactNativeEventEmitter : RCTEventEmitter <EXInternalModule, EXBridgeModule, EXModuleRegistryConsumer, EXEventEmitterService>

@property(nonatomic, strong) EXAppContext *appContext;

@end
