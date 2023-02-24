/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTSurfaceDelegate.h>
#import <ABI48_0_0React/ABI48_0_0RCTSurfaceProtocol.h>
#import <ABI48_0_0React/ABI48_0_0RCTSurfaceSizeMeasureMode.h>
#import <ABI48_0_0React/ABI48_0_0RCTSurfaceStage.h>

@class ABI48_0_0RCTBridge;
@class ABI48_0_0RCTSurface;

typedef UIView *_Nullable (^ABI48_0_0RCTSurfaceHostingViewActivityIndicatorViewFactory)(void);

NS_ASSUME_NONNULL_BEGIN

/**
 * UIView subclass which providers interoperability between UIKit and
 * Surface regarding layout and life-cycle.
 * This class can be used as easy-to-use general purpose integration point
 * of ABI48_0_0ReactNative-powered experiences in UIKit based apps.
 */
@interface ABI48_0_0RCTSurfaceHostingView : UIView <ABI48_0_0RCTSurfaceDelegate>

/**
 * Create an instance of ABI48_0_0RCTSurface to be hosted.
 */
+ (ABI48_0_0RCTSurface *)createSurfaceWithBridge:(ABI48_0_0RCTBridge *)bridge
                             moduleName:(NSString *)moduleName
                      initialProperties:(NSDictionary *)initialProperties;

/**
 * Designated initializer.
 * Instanciates a view with given Surface object.
 * Note: The view retains the surface object.
 */
- (instancetype)initWithSurface:(id<ABI48_0_0RCTSurfaceProtocol>)surface
                sizeMeasureMode:(ABI48_0_0RCTSurfaceSizeMeasureMode)sizeMeasureMode NS_DESIGNATED_INITIALIZER;

/**
 * Convenience initializer.
 * Instanciates a Surface object with given `bridge`, `moduleName`, and
 * `initialProperties`, and then use it to instanciate a view.
 */
- (instancetype)initWithBridge:(ABI48_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
               sizeMeasureMode:(ABI48_0_0RCTSurfaceSizeMeasureMode)sizeMeasureMode;

/**
 * Surface object which is currently using to power the view.
 * Read-only.
 */
@property (nonatomic, strong, readonly) id<ABI48_0_0RCTSurfaceProtocol> surface;

/**
 * Size measure mode which are defining relationship between UIKit and ABI48_0_0ReactNative
 * layout approaches.
 * Defaults to `ABI48_0_0RCTSurfaceSizeMeasureModeWidthAtMost | ABI48_0_0RCTSurfaceSizeMeasureModeHeightAtMost`.
 */
@property (nonatomic, assign) ABI48_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode;

/**
 * Activity indicator factory.
 * A hosting view may use this block to instantiate and display custom activity
 * (loading) indicator (aka "spinner") when it needed.
 * Defaults to `nil` (no activity indicator).
 */
@property (nonatomic, copy, nullable) ABI48_0_0RCTSurfaceHostingViewActivityIndicatorViewFactory activityIndicatorViewFactory;

@end

NS_ASSUME_NONNULL_END
