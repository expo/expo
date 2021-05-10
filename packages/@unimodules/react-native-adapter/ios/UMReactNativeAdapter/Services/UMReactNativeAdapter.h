// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMUIManager.h>
#import <UMCore/UMInternalModule.h>
#import <UMCore/UMAppLifecycleService.h>
#import <UMCore/UMAppLifecycleListener.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <UMCore/UMJavaScriptContextProvider.h>
#import <UMReactNativeAdapter/UMBridgeModule.h>

@interface UMReactNativeAdapter : NSObject <UMInternalModule, UMBridgeModule, UMAppLifecycleService, UMUIManager, UMJavaScriptContextProvider, UMModuleRegistryConsumer>

@end
