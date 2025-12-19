// Copyright 2018-present 650 Industries. All rights reserved.

#if !__building_module(ExpoModulesCore)
#import <React/RCTBridgeModule.h>
#else
@protocol RCTBridgeModule;
#endif

#import <ExpoModulesCore/EXInternalModule.h>
#import <ExpoModulesCore/EXEventEmitterService.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>

@protocol EXAppContextProtocol;

/**
 Event emitter for legacy (EXExportedModule-based) modules.
 Events are sent via JSI through the AppContext rather than through RCTEventEmitter/bridge.
 This allows expo-modules-core to avoid inheriting from RCTEventEmitter.
 */
@interface EXReactNativeEventEmitter : NSObject <EXInternalModule, RCTBridgeModule, EXModuleRegistryConsumer, EXEventEmitterService>

@property(nonatomic, strong) id<EXAppContextProtocol> appContext;

@end
