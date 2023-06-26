// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXUIManager.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXInternalModule.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXAppLifecycleService.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXAppLifecycleListener.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistryConsumer.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXJavaScriptContextProvider.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXBridgeModule.h>

@interface ABI49_0_0EXReactNativeAdapter : NSObject <ABI49_0_0EXInternalModule, ABI49_0_0EXBridgeModule, ABI49_0_0EXAppLifecycleService, ABI49_0_0EXUIManager, ABI49_0_0EXJavaScriptContextProvider, ABI49_0_0EXModuleRegistryConsumer>

- (void)setBridge:(ABI49_0_0RCTBridge *)bridge;

@end
