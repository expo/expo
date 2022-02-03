// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXAppLifecycleListener.h>

@protocol ABI43_0_0EXAppLifecycleService <NSObject>

- (void)registerAppLifecycleListener:(id<ABI43_0_0EXAppLifecycleListener>)listener;
- (void)unregisterAppLifecycleListener:(id<ABI43_0_0EXAppLifecycleListener>)listener;
- (void)setAppStateToBackground;
- (void)setAppStateToForeground;

@end
