// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXAppLifecycleListener.h>

@protocol ABI29_0_0EXAppLifecycleService <NSObject>

- (void)registerAppLifecycleListener:(id<ABI29_0_0EXAppLifecycleListener>)listener;
- (void)unregisterAppLifecycleListener:(id<ABI29_0_0EXAppLifecycleListener>)listener;
- (void)setAppStateToBackground;
- (void)setAppStateToForeground;

@end
