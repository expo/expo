/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI42_0_0React/ABI42_0_0RCTSurfaceStage.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI42_0_0RCTBridge;
@class ABI42_0_0RCTSurfaceView;
@protocol ABI42_0_0RCTSurfaceDelegate;

/**
 * ABI42_0_0RCTSurface instance represents ABI42_0_0React Native-powered piece of a user interface
 * which can be a full-screen app, separate modal view controller,
 * or even small widget.
 * It is called "Surface".
 *
 * The ABI42_0_0RCTSurface instance is completely thread-safe by design;
 * it can be created on any thread, and any its method can be called from
 * any thread (if the opposite is not mentioned explicitly).
 *
 * The primary goals of the ABI42_0_0RCTSurface are:
 *  * ability to measure and layout the surface in a thread-safe
 *    and synchronous manner;
 *  * ability to create a UIView instance on demand (later);
 *  * ability to communicate the current stage of the surface granularly.
 */
@interface ABI42_0_0RCTSurface : NSObject

@property (atomic, readonly) ABI42_0_0RCTSurfaceStage stage;
@property (atomic, readonly) NSString *moduleName;
@property (atomic, readonly) NSNumber *rootViewTag;

@property (atomic, readwrite, weak, nullable) id<ABI42_0_0RCTSurfaceDelegate> delegate;

@property (atomic, copy, readwrite) NSDictionary *properties;

- (instancetype)initWithBridge:(ABI42_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties;

#pragma mark - Dealing with UIView representation, the Main thread only access

/**
 * Creates (if needed) and returns `UIView` instance which represents the Surface.
 * The Surface will cache and *retain* this object.
 * Returning the UIView instance does not mean that the Surface is ready
 * to execute and layout. It can be just a handler which Surface will use later
 * to mount the actual views.
 * ABI42_0_0RCTSurface does not control (or influence in any way) the size or origin
 * of this view. Some superview (or another owner) must use other methods
 * of this class to setup proper layout and interop interactions with UIKit
 * or another UI framework.
 * This method must be called only from the main queue.
 */
- (ABI42_0_0RCTSurfaceView *)view;

#pragma mark - Layout: Setting the size constrains

/**
 * Sets `minimumSize` and `maximumSize` layout constraints for the Surface.
 */
- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize;

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
 * Simple shortcut to `-[ABI42_0_0RCTSurface setMinimumSize:size maximumSize:size]`.
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
 * the Surface reaches `stage`.
 * Limitations:
 *  - Do nothing, if called on `UIManager` queue.
 *  - Calling on the main queue with `ABI42_0_0RCTSurfaceStageSurfaceDidInitialMounting`
 *    stage temporary is not supported; in this case the stage will be
 *    downgraded to `ABI42_0_0RCTSurfaceStageSurfaceDidInitialLayout`.
 */
- (BOOL)synchronouslyWaitForStage:(ABI42_0_0RCTSurfaceStage)stage timeout:(NSTimeInterval)timeout;

#pragma mark - Start & Stop

/**
 * Starts or stops the Surface.
 * Those methods are a no-op for regular ABI42_0_0RCTSurface (for now), but all call sites must call them appropriately.
 */
- (BOOL)start;
- (BOOL)stop;

#pragma mark - Mounting/Unmounting of ABI42_0_0React components

/**
 * Mount the ABI42_0_0React component specified by the given moduleName. This is typically
 * calling runApplication.js from the native side.
 */
- (void)mountABI42_0_0ReactComponentWithBridge:(ABI42_0_0RCTBridge *)bridge
                           moduleName:(NSString *)moduleName
                               params:(NSDictionary *)params;

/**
 * Unmount the ABI42_0_0React component specified by the given rootViewTag, called from native.
 */
- (void)unmountABI42_0_0ReactComponentWithBridge:(ABI42_0_0RCTBridge *)bridge rootViewTag:(NSNumber *)rootViewTag;

@end

NS_ASSUME_NONNULL_END
