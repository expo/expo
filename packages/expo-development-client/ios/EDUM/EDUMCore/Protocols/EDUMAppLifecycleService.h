// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EDUMAppLifecycleListener.h>

@protocol EDUMAppLifecycleService <NSObject>

- (void)registerAppLifecycleListener:(id<EDUMAppLifecycleListener>)listener;
- (void)unregisterAppLifecycleListener:(id<EDUMAppLifecycleListener>)listener;
- (void)setAppStateToBackground;
- (void)setAppStateToForeground;

@end
