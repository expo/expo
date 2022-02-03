// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXAppLifecycleListener.h>

@protocol ABI44_0_0EXAppLifecycleService <NSObject>

- (void)registerAppLifecycleListener:(id<ABI44_0_0EXAppLifecycleListener>)listener;
- (void)unregisterAppLifecycleListener:(id<ABI44_0_0EXAppLifecycleListener>)listener;
- (void)setAppStateToBackground;
- (void)setAppStateToForeground;

@end
