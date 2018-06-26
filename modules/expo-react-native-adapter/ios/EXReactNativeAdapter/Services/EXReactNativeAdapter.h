// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXCore/EXUIManager.h>
#import <EXCore/EXInternalModule.h>
#import <EXCore/EXAppLifecycleService.h>
#import <EXCore/EXAppLifecycleListener.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <EXCore/EXJavaScriptContextProvider.h>
#import <EXReactNativeAdapter/EXBridgeModule.h>
#import <EXReactNativeAdapter/EXNativeModulesProxy.h>

@interface EXReactNativeAdapter : NSObject <EXInternalModule, EXBridgeModule, EXAppLifecycleService, EXUIManager, EXJavaScriptContextProvider>

@end
