// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI33_0_0UMCore/ABI33_0_0UMUIManager.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMInternalModule.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMAppLifecycleService.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMAppLifecycleListener.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryConsumer.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMJavaScriptContextProvider.h>
#import <ABI33_0_0UMReactNativeAdapter/ABI33_0_0UMBridgeModule.h>
#import <ABI33_0_0UMReactNativeAdapter/ABI33_0_0UMNativeModulesProxy.h>

@interface ABI33_0_0UMReactNativeAdapter : NSObject <ABI33_0_0UMInternalModule, ABI33_0_0UMBridgeModule, ABI33_0_0UMAppLifecycleService, ABI33_0_0UMUIManager, ABI33_0_0UMJavaScriptContextProvider, ABI33_0_0UMModuleRegistryConsumer>

@end
