// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI36_0_0UMCore/ABI36_0_0UMUIManager.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMInternalModule.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMAppLifecycleService.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMAppLifecycleListener.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryConsumer.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMJavaScriptContextProvider.h>
#import <ABI36_0_0UMReactNativeAdapter/ABI36_0_0UMBridgeModule.h>
#import <ABI36_0_0UMReactNativeAdapter/ABI36_0_0UMNativeModulesProxy.h>

@interface ABI36_0_0UMReactNativeAdapter : NSObject <ABI36_0_0UMInternalModule, ABI36_0_0UMBridgeModule, ABI36_0_0UMAppLifecycleService, ABI36_0_0UMUIManager, ABI36_0_0UMJavaScriptContextProvider, ABI36_0_0UMModuleRegistryConsumer>

@end
