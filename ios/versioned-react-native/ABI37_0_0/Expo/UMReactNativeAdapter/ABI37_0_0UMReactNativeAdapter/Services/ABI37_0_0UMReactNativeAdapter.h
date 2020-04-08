// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMCore/ABI37_0_0UMUIManager.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMInternalModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMAppLifecycleService.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMAppLifecycleListener.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryConsumer.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMJavaScriptContextProvider.h>
#import <ABI37_0_0UMReactNativeAdapter/ABI37_0_0UMBridgeModule.h>
#import <ABI37_0_0UMReactNativeAdapter/ABI37_0_0UMNativeModulesProxy.h>

@interface ABI37_0_0UMReactNativeAdapter : NSObject <ABI37_0_0UMInternalModule, ABI37_0_0UMBridgeModule, ABI37_0_0UMAppLifecycleService, ABI37_0_0UMUIManager, ABI37_0_0UMJavaScriptContextProvider, ABI37_0_0UMModuleRegistryConsumer>

@end
