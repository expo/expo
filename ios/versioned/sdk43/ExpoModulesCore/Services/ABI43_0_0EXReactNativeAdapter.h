// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0React/ABI43_0_0RCTBridge.h>

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUIManager.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXInternalModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXAppLifecycleService.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXAppLifecycleListener.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXJavaScriptContextProvider.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXBridgeModule.h>

@interface ABI43_0_0EXReactNativeAdapter : NSObject <ABI43_0_0EXInternalModule, ABI43_0_0EXBridgeModule, ABI43_0_0EXAppLifecycleService, ABI43_0_0EXUIManager, ABI43_0_0EXJavaScriptContextProvider, ABI43_0_0EXModuleRegistryConsumer>

- (void)setBridge:(ABI43_0_0RCTBridge *)bridge;

@end
