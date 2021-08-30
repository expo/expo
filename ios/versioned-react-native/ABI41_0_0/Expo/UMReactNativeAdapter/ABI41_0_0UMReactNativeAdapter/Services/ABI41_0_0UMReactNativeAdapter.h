// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMUIManager.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMInternalModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMAppLifecycleService.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMAppLifecycleListener.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMJavaScriptContextProvider.h>
#import <ABI41_0_0UMReactNativeAdapter/ABI41_0_0UMBridgeModule.h>

@interface ABI41_0_0UMReactNativeAdapter : NSObject <ABI41_0_0UMInternalModule, ABI41_0_0UMBridgeModule, ABI41_0_0UMAppLifecycleService, ABI41_0_0UMUIManager, ABI41_0_0UMJavaScriptContextProvider, ABI41_0_0UMModuleRegistryConsumer>

@end
