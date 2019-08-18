// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXCore/ABI32_0_0EXUIManager.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXInternalModule.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXAppLifecycleService.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXAppLifecycleListener.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistryConsumer.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXJavaScriptContextProvider.h>
#import <ABI32_0_0EXImageLoaderInterface/ABI32_0_0EXImageLoaderInterface.h>
#import <ABI32_0_0EXReactNativeAdapter/ABI32_0_0EXBridgeModule.h>
#import <ABI32_0_0EXReactNativeAdapter/ABI32_0_0EXNativeModulesProxy.h>

@interface ABI32_0_0EXReactNativeAdapter : NSObject <ABI32_0_0EXInternalModule, ABI32_0_0EXBridgeModule, ABI32_0_0EXAppLifecycleService, ABI32_0_0EXUIManager, ABI32_0_0EXJavaScriptContextProvider, ABI32_0_0EXImageLoaderInterface>

@end
