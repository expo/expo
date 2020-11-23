// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMAppLifecycleListener.h>

@protocol ABI40_0_0UMAppLifecycleService <NSObject>

- (void)registerAppLifecycleListener:(id<ABI40_0_0UMAppLifecycleListener>)listener;
- (void)unregisterAppLifecycleListener:(id<ABI40_0_0UMAppLifecycleListener>)listener;
- (void)setAppStateToBackground;
- (void)setAppStateToForeground;

@end
