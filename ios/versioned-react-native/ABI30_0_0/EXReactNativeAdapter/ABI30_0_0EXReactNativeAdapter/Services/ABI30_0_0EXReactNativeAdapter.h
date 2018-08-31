// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXCore/ABI30_0_0EXUIManager.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXInternalModule.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXAppLifecycleService.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXAppLifecycleListener.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistryConsumer.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXJavaScriptContextProvider.h>
#import <ABI30_0_0EXImageLoaderInterface/ABI30_0_0EXImageLoaderInterface.h>
#import <ABI30_0_0EXReactNativeAdapter/ABI30_0_0EXBridgeModule.h>
#import <ABI30_0_0EXReactNativeAdapter/ABI30_0_0EXNativeModulesProxy.h>

@interface ABI30_0_0EXReactNativeAdapter : NSObject <ABI30_0_0EXInternalModule, ABI30_0_0EXBridgeModule, ABI30_0_0EXAppLifecycleService, ABI30_0_0EXUIManager, ABI30_0_0EXJavaScriptContextProvider, ABI30_0_0EXImageLoaderInterface>

@end
