// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMAppLifecycleListener.h>

@protocol ABI36_0_0UMAppLifecycleService <NSObject>

- (void)registerAppLifecycleListener:(id<ABI36_0_0UMAppLifecycleListener>)listener;
- (void)unregisterAppLifecycleListener:(id<ABI36_0_0UMAppLifecycleListener>)listener;
- (void)setAppStateToBackground;
- (void)setAppStateToForeground;

@end
