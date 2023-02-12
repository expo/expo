// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXAppLifecycleListener.h>

@protocol ABI48_0_0EXAppLifecycleService <NSObject>

- (void)registerAppLifecycleListener:(id<ABI48_0_0EXAppLifecycleListener>)listener;
- (void)unregisterAppLifecycleListener:(id<ABI48_0_0EXAppLifecycleListener>)listener;
- (void)setAppStateToBackground;
- (void)setAppStateToForeground;

@end
