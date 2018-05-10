// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXAppLifecycleListener.h>

@protocol EXLifecycleManager

- (void)registerAppLifecycleListener:(id<EXAppLifecycleListener>)listener;
- (void)unregisterAppLifecycleListener:(id<EXAppLifecycleListener>)listener;

@end

