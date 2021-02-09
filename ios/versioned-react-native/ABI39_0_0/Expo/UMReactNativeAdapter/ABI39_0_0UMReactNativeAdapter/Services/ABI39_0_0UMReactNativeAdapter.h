// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMCore/ABI39_0_0UMUIManager.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMInternalModule.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMAppLifecycleService.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMAppLifecycleListener.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryConsumer.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMJavaScriptContextProvider.h>
#import <ABI39_0_0UMReactNativeAdapter/ABI39_0_0UMBridgeModule.h>

@interface ABI39_0_0UMReactNativeAdapter : NSObject <ABI39_0_0UMInternalModule, ABI39_0_0UMBridgeModule, ABI39_0_0UMAppLifecycleService, ABI39_0_0UMUIManager, ABI39_0_0UMJavaScriptContextProvider, ABI39_0_0UMModuleRegistryConsumer>

@end
