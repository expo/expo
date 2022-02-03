/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTRootView.h>

#import "ABI42_0_0RCTSurfaceHostingView.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * This is a ABI42_0_0RCTRootView-compatible implementation of ABI42_0_0RCTSurfaceHostingView.
 * Use this class to replace all usages of ABI42_0_0RCTRootView in the app for easier migration
 * to ABI42_0_0RCTSurfaceHostingView.
 *
 * WARNING: In the future, ABI42_0_0RCTRootView will be deprecated in favor of ABI42_0_0RCTSurfaceHostingView.
 */
@interface ABI42_0_0RCTSurfaceHostingProxyRootView : ABI42_0_0RCTSurfaceHostingView

#pragma mark ABI42_0_0RCTRootView compatibility - keep these sync'ed with ABI42_0_0RCTRootView.h

@property (nonatomic, copy, readonly) NSString *moduleName;
@property (nonatomic, strong, readonly) ABI42_0_0RCTBridge *bridge;
@property (nonatomic, copy, readwrite) NSDictionary *appProperties;
@property (nonatomic, assign) ABI42_0_0RCTRootViewSizeFlexibility sizeFlexibility;
@property (nonatomic, weak) id<ABI42_0_0RCTRootViewDelegate> delegate;
@property (nonatomic, weak) UIViewController *ABI42_0_0ReactViewController;
@property (nonatomic, strong, readonly) UIView *contentView;
@property (nonatomic, strong) UIView *loadingView;
@property (nonatomic, assign) BOOL passThroughTouches;
@property (nonatomic, assign) NSTimeInterval loadingViewFadeDelay;
@property (nonatomic, assign) NSTimeInterval loadingViewFadeDuration;

- (instancetype)initWithBridge:(ABI42_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties NS_DESIGNATED_INITIALIZER;

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                initialProperties:(NSDictionary *)initialProperties
                    launchOptions:(NSDictionary *)launchOptions;

- (instancetype)initWithSurface:(ABI42_0_0RCTSurface *)surface
                sizeMeasureMode:(ABI42_0_0RCTSurfaceSizeMeasureMode)sizeMeasureMode NS_UNAVAILABLE;

- (void)cancelTouches;

@end

NS_ASSUME_NONNULL_END
