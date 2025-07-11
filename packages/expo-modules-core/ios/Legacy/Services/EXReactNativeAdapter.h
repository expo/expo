// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<React/React-Core-umbrella.h>)
#import <React/React-Core-umbrella.h>
#else
#import <React_Core/React_Core-umbrella.h>
#endif

#import <ExpoModulesCore/EXUIManager.h>
#import <ExpoModulesCore/EXInternalModule.h>
#import <ExpoModulesCore/EXAppLifecycleService.h>
#import <ExpoModulesCore/EXAppLifecycleListener.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>
#import <ExpoModulesCore/EXJavaScriptContextProvider.h>
#import <ExpoModulesCore/EXBridgeModule.h>

@interface EXReactNativeAdapter : NSObject <EXInternalModule, EXBridgeModule, EXAppLifecycleService, EXUIManager, EXJavaScriptContextProvider, EXModuleRegistryConsumer>

- (void)setBridge:(RCTBridge *)bridge;

@end
