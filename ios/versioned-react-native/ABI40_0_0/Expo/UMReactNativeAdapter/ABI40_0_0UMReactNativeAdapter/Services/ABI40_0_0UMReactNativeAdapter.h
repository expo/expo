// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMUIManager.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMInternalModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMAppLifecycleService.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMAppLifecycleListener.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMJavaScriptContextProvider.h>
#import <ABI40_0_0UMReactNativeAdapter/ABI40_0_0UMBridgeModule.h>

@interface ABI40_0_0UMReactNativeAdapter : NSObject <ABI40_0_0UMInternalModule, ABI40_0_0UMBridgeModule, ABI40_0_0UMAppLifecycleService, ABI40_0_0UMUIManager, ABI40_0_0UMJavaScriptContextProvider, ABI40_0_0UMModuleRegistryConsumer>

@end
