// Copyright 2018-present 650 Industries. All rights reserved.

#import <EDUMUIManager.h>
#import <EDUMInternalModule.h>
#import <EDUMAppLifecycleService.h>
#import <EDUMAppLifecycleListener.h>
#import <EDUMModuleRegistryConsumer.h>
#import <EDUMJavaScriptContextProvider.h>
#import <EDUMBridgeModule.h>
#import <EDUMNativeModulesProxy.h>

@interface EDUMReactNativeAdapter : NSObject <EDUMInternalModule, EDUMBridgeModule, EDUMAppLifecycleService, EDUMUIManager, EDUMJavaScriptContextProvider, EDUMModuleRegistryConsumer>

@end
