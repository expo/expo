// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI35_0_0UMCore/ABI35_0_0UMUIManager.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMInternalModule.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMAppLifecycleService.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMAppLifecycleListener.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMModuleRegistryConsumer.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMJavaScriptContextProvider.h>
#import <ABI35_0_0UMReactNativeAdapter/ABI35_0_0UMBridgeModule.h>
#import <ABI35_0_0UMReactNativeAdapter/ABI35_0_0UMNativeModulesProxy.h>

@interface ABI35_0_0UMReactNativeAdapter : NSObject <ABI35_0_0UMInternalModule, ABI35_0_0UMBridgeModule, ABI35_0_0UMAppLifecycleService, ABI35_0_0UMUIManager, ABI35_0_0UMJavaScriptContextProvider, ABI35_0_0UMModuleRegistryConsumer>

@end
