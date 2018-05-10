// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXCore/EXInternalModule.h>
#import <EXCore/EXAppLifecycleListener.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <EXReactNativeAdapter/EXBridgeModule.h>
#import <EXReactNativeAdapter/EXNativeModulesProxy.h>

@interface EXReactNativeAdapter : NSObject <EXInternalModule, EXBridgeModule>

- (void)addUIBlock:(void (^)(id))block forView:(id)viewId ofClass:(Class)klass;
- (void)registerAppLifecycleListener:(id<EXAppLifecycleListener>)listener;
- (void)unregisterAppLifecycleListener:(id<EXAppLifecycleListener>)listener;


@end
