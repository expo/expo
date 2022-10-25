// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXUIManager.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXInternalModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXAppLifecycleService.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXAppLifecycleListener.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryConsumer.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXJavaScriptContextProvider.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXBridgeModule.h>

@interface ABI47_0_0EXReactNativeAdapter : NSObject <ABI47_0_0EXInternalModule, ABI47_0_0EXBridgeModule, ABI47_0_0EXAppLifecycleService, ABI47_0_0EXUIManager, ABI47_0_0EXJavaScriptContextProvider, ABI47_0_0EXModuleRegistryConsumer>

- (void)setBridge:(ABI47_0_0RCTBridge *)bridge;

@end
