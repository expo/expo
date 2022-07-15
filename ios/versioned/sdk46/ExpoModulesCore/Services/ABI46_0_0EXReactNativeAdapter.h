// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0React/ABI46_0_0RCTBridge.h>

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXUIManager.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXInternalModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXAppLifecycleService.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXAppLifecycleListener.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryConsumer.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXJavaScriptContextProvider.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXBridgeModule.h>

@interface ABI46_0_0EXReactNativeAdapter : NSObject <ABI46_0_0EXInternalModule, ABI46_0_0EXBridgeModule, ABI46_0_0EXAppLifecycleService, ABI46_0_0EXUIManager, ABI46_0_0EXJavaScriptContextProvider, ABI46_0_0EXModuleRegistryConsumer>

- (void)setBridge:(ABI46_0_0RCTBridge *)bridge;

@end
