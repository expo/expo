// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXUIManager.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXInternalModule.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXAppLifecycleService.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXAppLifecycleListener.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistryConsumer.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXJavaScriptContextProvider.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXBridgeModule.h>

@interface ABI48_0_0EXReactNativeAdapter : NSObject <ABI48_0_0EXInternalModule, ABI48_0_0EXBridgeModule, ABI48_0_0EXAppLifecycleService, ABI48_0_0EXUIManager, ABI48_0_0EXJavaScriptContextProvider, ABI48_0_0EXModuleRegistryConsumer>

- (void)setBridge:(ABI48_0_0RCTBridge *)bridge;

@end
