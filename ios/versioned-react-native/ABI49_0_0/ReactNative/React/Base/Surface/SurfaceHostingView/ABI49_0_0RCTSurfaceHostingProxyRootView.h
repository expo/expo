/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>
#import <ABI49_0_0React/ABI49_0_0RCTRootView.h>

#import "ABI49_0_0RCTSurfaceHostingView.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * This is a ABI49_0_0RCTRootView-compatible implementation of ABI49_0_0RCTSurfaceHostingView.
 * Use this class to replace all usages of ABI49_0_0RCTRootView in the app for easier migration
 * to ABI49_0_0RCTSurfaceHostingView.
 *
 * WARNING: In the future, ABI49_0_0RCTRootView will be deprecated in favor of ABI49_0_0RCTSurfaceHostingView.
 */
@interface ABI49_0_0RCTSurfaceHostingProxyRootView : ABI49_0_0RCTSurfaceHostingView

#pragma mark ABI49_0_0RCTRootView compatibility - keep these sync'ed with ABI49_0_0RCTRootView.h

@property (nonatomic, copy, readonly) NSString *moduleName;
@property (nonatomic, strong, readonly) ABI49_0_0RCTBridge *bridge;
@property (nonatomic, readonly) BOOL hasBridge;
@property (nonatomic, strong, readonly) ABI49_0_0RCTModuleRegistry *moduleRegistry;
@property (nonatomic, strong, readonly) id<ABI49_0_0RCTEventDispatcherProtocol> eventDispatcher;
@property (nonatomic, copy, readwrite) NSDictionary *appProperties;
@property (nonatomic, assign) ABI49_0_0RCTRootViewSizeFlexibility sizeFlexibility;
@property (nonatomic, weak) id<ABI49_0_0RCTRootViewDelegate> delegate;
@property (nonatomic, weak) UIViewController *ABI49_0_0ReactViewController;
@property (nonatomic, strong, readonly) UIView *contentView;
@property (nonatomic, strong) UIView *loadingView;
@property (nonatomic, assign) BOOL passThroughTouches;
@property (nonatomic, assign) NSTimeInterval loadingViewFadeDelay;
@property (nonatomic, assign) NSTimeInterval loadingViewFadeDuration;
@property (nonatomic, assign) CGSize minimumSize;

- (instancetype)initWithBridge:(ABI49_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties NS_DESIGNATED_INITIALIZER;

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                initialProperties:(NSDictionary *)initialProperties
                    launchOptions:(NSDictionary *)launchOptions;

/**
 * Bridgeless mode initializer
 */
- (instancetype)initWithSurface:(id<ABI49_0_0RCTSurfaceProtocol>)surface
                sizeMeasureMode:(ABI49_0_0RCTSurfaceSizeMeasureMode)sizeMeasureMode
                 moduleRegistry:(ABI49_0_0RCTModuleRegistry *)moduleRegistry;

- (void)cancelTouches;

@end

NS_ASSUME_NONNULL_END
