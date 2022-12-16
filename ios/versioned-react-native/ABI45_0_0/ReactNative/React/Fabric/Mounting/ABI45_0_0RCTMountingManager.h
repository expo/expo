/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI45_0_0React/ABI45_0_0RCTMountingManagerDelegate.h>
#import <ABI45_0_0React/ABI45_0_0RCTPrimitives.h>
#import <ABI45_0_0React/ABI45_0_0renderer/core/ComponentDescriptor.h>
#import <ABI45_0_0React/ABI45_0_0renderer/core/ABI45_0_0ReactPrimitives.h>
#import <ABI45_0_0React/ABI45_0_0renderer/mounting/MountingCoordinator.h>
#import <ABI45_0_0React/ABI45_0_0renderer/mounting/ShadowView.h>
#import <ABI45_0_0React/ABI45_0_0utils/ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI45_0_0RCTComponentViewRegistry;

/**
 * Manages mounting process.
 */
@interface ABI45_0_0RCTMountingManager : NSObject

@property (nonatomic, weak) id<ABI45_0_0RCTMountingManagerDelegate> delegate;
@property (nonatomic, strong) ABI45_0_0RCTComponentViewRegistry *componentViewRegistry;

- (void)setContextContainer:(ABI45_0_0facebook::ABI45_0_0React::ContextContainer::Shared)contextContainer;

/**
 * Designates the view as a rendering viewport of a ABI45_0_0React Native surface.
 * The provided view must not have any subviews, and the caller is not supposed to interact with the view hierarchy
 * inside the provided view. The view hierarchy created by mounting infrastructure inside the provided view does not
 * influence the intrinsic size of the view and cannot be measured using UIView/UIKit layout API.
 * Must be called on the main thead.
 */
- (void)attachSurfaceToView:(UIView *)view surfaceId:(ABI45_0_0facebook::ABI45_0_0React::SurfaceId)surfaceId;

/**
 * Stops designating the view as a rendering viewport of a ABI45_0_0React Native surface.
 */
- (void)detachSurfaceFromView:(UIView *)view surfaceId:(ABI45_0_0facebook::ABI45_0_0React::SurfaceId)surfaceId;

/**
 * Schedule a mounting transaction to be performed on the main thread.
 * Can be called from any thread.
 */
- (void)scheduleTransaction:(ABI45_0_0facebook::ABI45_0_0React::MountingCoordinator::Shared const &)mountingCoordinator;

/**
 * Dispatch a command to be performed on the main thread.
 * Can be called from any thread.
 */
- (void)dispatchCommand:(ABI45_0_0ReactTag)ABI45_0_0ReactTag commandName:(NSString *)commandName args:(NSArray *)args;

/**
 * Dispatch an accessibility event to be performed on the main thread.
 * Can be called from any thread.
 */
- (void)sendAccessibilityEvent:(ABI45_0_0ReactTag)ABI45_0_0ReactTag eventType:(NSString *)eventType;

- (void)setIsJSResponder:(BOOL)isJSResponder
    blockNativeResponder:(BOOL)blockNativeResponder
           forShadowView:(ABI45_0_0facebook::ABI45_0_0React::ShadowView)shadowView;

- (void)synchronouslyUpdateViewOnUIThread:(ABI45_0_0ReactTag)ABI45_0_0ReactTag
                             changedProps:(NSDictionary *)props
                      componentDescriptor:(ABI45_0_0facebook::ABI45_0_0React::ComponentDescriptor const &)componentDescriptor;
@end

NS_ASSUME_NONNULL_END
