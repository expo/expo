/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTSurfaceProtocol.h>
#import <ABI49_0_0React/renderer/scheduler/ABI49_0_0SurfaceHandler.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI49_0_0RCTBridge;
@class ABI49_0_0RCTSurfaceView;
@class ABI49_0_0RCTSurfacePresenter;

/**
 * (This is Fabric-compatible ABI49_0_0RCTSurface implementation.)
 *
 * ABI49_0_0RCTSurface instance represents ABI49_0_0React Native-powered piece of a user interface
 * which can be a full-screen app, separate modal view controller,
 * or even small widget.
 * It is called "Surface".
 *
 * The ABI49_0_0RCTSurface instance is completely thread-safe by design;
 * it can be created on any thread, and any its method can be called from
 * any thread (if the opposite is not mentioned explicitly).
 *
 * The primary goals of the ABI49_0_0RCTSurface are:
 *  * ability to measure and layout the surface in a thread-safe
 *    and synchronous manner;
 *  * ability to create a UIView instance on demand (later);
 *  * ability to communicate the current stage of the surface granularly.
 */
@interface ABI49_0_0RCTFabricSurface : NSObject <ABI49_0_0RCTSurfaceProtocol>

- (instancetype)initWithSurfacePresenter:(ABI49_0_0RCTSurfacePresenter *)surfacePresenter
                              moduleName:(NSString *)moduleName
                       initialProperties:(NSDictionary *)initialProperties;

#pragma mark - Surface presenter

/**
 * ABI49_0_0EXPERIMENTAL
 * Reset's the Surface to it's initial stage.
 * It uses the passed in surface presenter, and whatever else was passed in init.
 */
- (void)resetWithSurfacePresenter:(ABI49_0_0RCTSurfacePresenter *)surfacePresenter;

#pragma mark - Dealing with UIView representation, the Main thread only access

/**
 * Creates (if needed) and returns `UIView` instance which represents the Surface.
 * The Surface will cache and *retain* this object.
 * Returning the UIView instance does not mean that the Surface is ready
 * to execute and layout. It can be just a handler which Surface will use later
 * to mount the actual views.
 * ABI49_0_0RCTSurface does not control (or influence in any way) the size or origin
 * of this view. Some superview (or another owner) must use other methods
 * of this class to setup proper layout and interop interactions with UIKit
 * or another UI framework.
 * This method must be called only from the main queue.
 */
- (ABI49_0_0RCTSurfaceView *)view;

#pragma mark - Layout: Setting the size constrains

/**
 * Previously set `minimumSize` layout constraint.
 * Defaults to `{0, 0}`.
 */
@property (atomic, assign, readonly) CGSize minimumSize;

/**
 * Previously set `maximumSize` layout constraint.
 * Defaults to `{CGFLOAT_MAX, CGFLOAT_MAX}`.
 */
@property (atomic, assign, readonly) CGSize maximumSize;

/**
 * Previously set `viewportOffset` layout constraint.
 * Defaults to `{0, 0}`.
 */
@property (atomic, assign, readonly) CGPoint viewportOffset;

/**
 * Simple shortcut to `-[ABI49_0_0RCTSurface setMinimumSize:size maximumSize:size]`.
 */
- (void)setSize:(CGSize)size;

#pragma mark - Layout: Measuring

/**
 * Measures the Surface with given constraints.
 * This method does not cause any side effects on the surface object.
 */
- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize;

/**
 * Return the current size of the root view based on (but not clamp by) current
 * size constraints.
 */
@property (atomic, assign, readonly) CGSize intrinsicSize;

#pragma mark - Synchronous waiting

/**
 * Synchronously blocks the current thread up to given `timeout` until
 * the Surface is rendered.
 */
- (BOOL)synchronouslyWaitFor:(NSTimeInterval)timeout;

@end

@interface ABI49_0_0RCTFabricSurface (Internal)

- (ABI49_0_0facebook::ABI49_0_0React::SurfaceHandler const &)surfaceHandler;

@end

@interface ABI49_0_0RCTFabricSurface (Deprecated)

/**
 * Deprecated. Use `initWithSurfacePresenter:moduleName:initialProperties` instead.
 */
- (instancetype)initWithBridge:(ABI49_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties;

@end

NS_ASSUME_NONNULL_END
