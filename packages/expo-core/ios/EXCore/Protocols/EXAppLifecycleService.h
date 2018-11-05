// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXAppLifecycleListener.h>

@protocol EXAppLifecycleService <NSObject>

- (void)registerAppLifecycleListener:(id<EXAppLifecycleListener>)listener;
- (void)unregisterAppLifecycleListener:(id<EXAppLifecycleListener>)listener;
- (void)setAppStateToBackground;
- (void)setAppStateToForeground;

@end
