// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXAppLifecycleListener.h>

@protocol EXPlatformAdapter

- (void)addUIBlock:(void (^)(id))block forView:(id)viewId ofClass:(Class)klass;
- (void)registerAppLifecycleListener:(id<EXAppLifecycleListener>)listener;
- (void)unregisterAppLifecycleListener:(id<EXAppLifecycleListener>)listener;

@end

