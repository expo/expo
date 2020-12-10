// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

#import <React/RCTBridge.h>
#import <React/RCTRootView.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTRootView (Private)

- (void)bundleFinishedLoading:(RCTBridge *)bridge;

@end

@interface DevMenuRootView : RCTRootView

- (void)javaScriptDidLoad:(NSNotification *)notification;

@end

NS_ASSUME_NONNULL_END
