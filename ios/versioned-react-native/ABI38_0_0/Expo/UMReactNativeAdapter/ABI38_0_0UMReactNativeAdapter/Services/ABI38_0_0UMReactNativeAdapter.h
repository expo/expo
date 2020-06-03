// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMUIManager.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMInternalModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMAppLifecycleService.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMAppLifecycleListener.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMJavaScriptContextProvider.h>
#import <ABI38_0_0UMReactNativeAdapter/ABI38_0_0UMBridgeModule.h>
#import <ABI38_0_0UMReactNativeAdapter/ABI38_0_0UMNativeModulesProxy.h>

@interface ABI38_0_0UMReactNativeAdapter : NSObject <ABI38_0_0UMInternalModule, ABI38_0_0UMBridgeModule, ABI38_0_0UMAppLifecycleService, ABI38_0_0UMUIManager, ABI38_0_0UMJavaScriptContextProvider, ABI38_0_0UMModuleRegistryConsumer>

@end
