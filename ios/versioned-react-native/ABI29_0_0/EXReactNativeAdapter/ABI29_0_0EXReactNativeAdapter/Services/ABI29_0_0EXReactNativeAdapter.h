// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI29_0_0EXCore/ABI29_0_0EXUIManager.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXInternalModule.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXAppLifecycleService.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXAppLifecycleListener.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXModuleRegistryConsumer.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXJavaScriptContextProvider.h>
#import <ABI29_0_0EXReactNativeAdapter/ABI29_0_0EXBridgeModule.h>
#import <ABI29_0_0EXReactNativeAdapter/ABI29_0_0EXNativeModulesProxy.h>

@interface ABI29_0_0EXReactNativeAdapter : NSObject <ABI29_0_0EXInternalModule, ABI29_0_0EXBridgeModule, ABI29_0_0EXAppLifecycleService, ABI29_0_0EXUIManager, ABI29_0_0EXJavaScriptContextProvider>

@end
