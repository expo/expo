/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTSurfaceProtocol.h>
#import <ABI43_0_0React/ABI43_0_0RCTSurfaceStage.h>
#import <ABI43_0_0React/ABI43_0_0renderer/mounting/MountingCoordinator.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI43_0_0RCTBridge;
@class ABI43_0_0RCTSurfaceView;
@class ABI43_0_0RCTSurfacePresenter;
@protocol ABI43_0_0RCTSurfaceDelegate;

/**
 * (This is Fabric-compatible ABI43_0_0RCTSurface implementation.)
 *
 * ABI43_0_0RCTSurface instance represents ABI43_0_0React Native-powered piece of a user interface
 * which can be a full-screen app, separate modal view controller,
 * or even small widget.
 * It is called "Surface".
 *
 * The ABI43_0_0RCTSurface instance is completely thread-safe by design;
 * it can be created on any thread, and any its method can be called from
 * any thread (if the opposite is not mentioned explicitly).
 *
 * The primary goals of the ABI43_0_0RCTSurface are:
 *  * ability to measure and layout the surface in a thread-safe
 *    and synchronous manner;
 *  * ability to create a UIView instance on demand (later);
 *  * ability to communicate the current stage of the surface granularly.
 */
@interface ABI43_0_0RCTFabricSurface : NSObject <ABI43_0_0RCTSurfaceProtocol>

- (instancetype)initWithSurfacePresenter:(ABI43_0_0RCTSurfacePresenter *)surfacePresenter
                              moduleName:(NSString *)moduleName
                       initialProperties:(NSDictionary *)initialProperties;

#pragma mark - Dealing with UIView representation, the Main thread only access

/**
 * Creates (if needed) and returns `UIView` instance which represents the Surface.
 * The Surface will cache and *retain* this object.
 * Returning the UIView instance does not mean that the Surface is ready
 * to execute and layout. It can be just a handler which Surface will use later
 * to mount the actual views.
 * ABI43_0_0RCTSurface does not control (or influence in any way) the size or origin
 * of this view. Some superview (or another owner) must use other methods
 * of this class to setup proper layout and interop interactions with UIKit
 * or another UI framework.
 * This method must be called only from the main queue.
 */
- (ABI43_0_0RCTSurfaceView *)view;

#pragma mark - Start & Stop

/**
 * Starts or stops the Surface.
 * A Surface object can be stopped and then restarted.
 * The starting process includes initializing all underlying ABI43_0_0React Native
 * infrastructure and running ABI43_0_0React app.
 * Surface stops itself on deallocation automatically.
 * Returns YES in case of success. Returns NO if the Surface is already
 * started or stopped.
 */
- (BOOL)start;
- (BOOL)stop;

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
 * Simple shortcut to `-[ABI43_0_0RCTSurface setMinimumSize:size maximumSize:size]`.
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

@interface ABI43_0_0RCTFabricSurface (Internal)

/**
 * Sets and clears given stage flags (bitmask).
 * Returns `YES` if the actual state was changed.
 */
- (BOOL)_setStage:(ABI43_0_0RCTSurfaceStage)stage;
- (BOOL)_unsetStage:(ABI43_0_0RCTSurfaceStage)stage;

@end

@interface ABI43_0_0RCTFabricSurface (Deprecated)

/**
 * Deprecated. Use `initWithSurfacePresenter:moduleName:initialProperties` instead.
 */
- (instancetype)initWithBridge:(ABI43_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties;

@end

NS_ASSUME_NONNULL_END
