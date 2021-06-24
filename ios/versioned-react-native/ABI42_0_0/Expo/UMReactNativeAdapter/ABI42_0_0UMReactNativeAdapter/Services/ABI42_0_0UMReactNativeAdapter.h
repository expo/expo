// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMUIManager.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMInternalModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMAppLifecycleService.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMAppLifecycleListener.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMJavaScriptContextProvider.h>
#import <ABI42_0_0UMReactNativeAdapter/ABI42_0_0UMBridgeModule.h>

@interface ABI42_0_0UMReactNativeAdapter : NSObject <ABI42_0_0UMInternalModule, ABI42_0_0UMBridgeModule, ABI42_0_0UMAppLifecycleService, ABI42_0_0UMUIManager, ABI42_0_0UMJavaScriptContextProvider, ABI42_0_0UMModuleRegistryConsumer>

@end
