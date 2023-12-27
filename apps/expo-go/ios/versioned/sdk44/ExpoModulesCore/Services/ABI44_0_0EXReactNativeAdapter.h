// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0React/ABI44_0_0RCTBridge.h>

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXUIManager.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXInternalModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXAppLifecycleService.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXAppLifecycleListener.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXJavaScriptContextProvider.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXBridgeModule.h>

@interface ABI44_0_0EXReactNativeAdapter : NSObject <ABI44_0_0EXInternalModule, ABI44_0_0EXBridgeModule, ABI44_0_0EXAppLifecycleService, ABI44_0_0EXUIManager, ABI44_0_0EXJavaScriptContextProvider, ABI44_0_0EXModuleRegistryConsumer>

- (void)setBridge:(ABI44_0_0RCTBridge *)bridge;

@end
