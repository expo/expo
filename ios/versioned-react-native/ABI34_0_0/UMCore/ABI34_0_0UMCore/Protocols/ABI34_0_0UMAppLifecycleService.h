// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMAppLifecycleListener.h>

@protocol ABI34_0_0UMAppLifecycleService <NSObject>

- (void)registerAppLifecycleListener:(id<ABI34_0_0UMAppLifecycleListener>)listener;
- (void)unregisterAppLifecycleListener:(id<ABI34_0_0UMAppLifecycleListener>)listener;
- (void)setAppStateToBackground;
- (void)setAppStateToForeground;

@end
