// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXCore/EXAppLifecycleListener.h>
#import <EXReactNativeAdapter/EXBridgeModule.h>
#import <EXReactNativeAdapter/EXNativeModulesProxy.h>

@interface EXReactNativeAdapter : NSObject <EXModule, EXBridgeModule>

- (void)sendEventWithName:(NSString *)name body:(id)body;
- (void)setNativeModulesProxy:(EXNativeModulesProxy *)modulesProxy;
- (void)addUIBlock:(void (^)(id))block forView:(id)viewId ofClass:(Class)klass;
- (void)registerAppLifecycleListener:(id<EXAppLifecycleListener>)listener;
- (void)unregisterAppLifecycleListener:(id<EXAppLifecycleListener>)listener;


@end
