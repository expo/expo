// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI34_0_0UMCore/ABI34_0_0UMUIManager.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMInternalModule.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMAppLifecycleService.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMAppLifecycleListener.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistryConsumer.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMJavaScriptContextProvider.h>
#import <ABI34_0_0UMReactNativeAdapter/ABI34_0_0UMBridgeModule.h>
#import <ABI34_0_0UMReactNativeAdapter/ABI34_0_0UMNativeModulesProxy.h>

@interface ABI34_0_0UMReactNativeAdapter : NSObject <ABI34_0_0UMInternalModule, ABI34_0_0UMBridgeModule, ABI34_0_0UMAppLifecycleService, ABI34_0_0UMUIManager, ABI34_0_0UMJavaScriptContextProvider, ABI34_0_0UMModuleRegistryConsumer>

@end
