// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0React/ABI45_0_0RCTBridge.h>

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXUIManager.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXInternalModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXAppLifecycleService.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXAppLifecycleListener.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryConsumer.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXJavaScriptContextProvider.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXBridgeModule.h>

@interface ABI45_0_0EXReactNativeAdapter : NSObject <ABI45_0_0EXInternalModule, ABI45_0_0EXBridgeModule, ABI45_0_0EXAppLifecycleService, ABI45_0_0EXUIManager, ABI45_0_0EXJavaScriptContextProvider, ABI45_0_0EXModuleRegistryConsumer>

- (void)setBridge:(ABI45_0_0RCTBridge *)bridge;

@end
