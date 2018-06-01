/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI28_0_0/ABI28_0_0RCTSurfaceDelegate.h>
#import <ReactABI28_0_0/ABI28_0_0RCTSurfaceSizeMeasureMode.h>
#import <ReactABI28_0_0/ABI28_0_0RCTSurfaceStage.h>

@class ABI28_0_0RCTBridge;
@class ABI28_0_0RCTSurface;

typedef UIView *(^ABI28_0_0RCTSurfaceHostingViewActivityIndicatorViewFactory)();

NS_ASSUME_NONNULL_BEGIN

/**
 * UIView subclass which providers interoperability between UIKit and
 * Surface regarding layout and life-cycle.
 * This class can be used as easy-to-use general purpose integration point
 * of ReactABI28_0_0Native-powered experiences in UIKit based apps.
 */
@interface ABI28_0_0RCTSurfaceHostingView : UIView <ABI28_0_0RCTSurfaceDelegate>

/**
 * Designated initializer.
 * Instanciates a view with given Surface object.
 * Note: The view retains the surface object.
 */
- (instancetype)initWithSurface:(ABI28_0_0RCTSurface *)surface NS_DESIGNATED_INITIALIZER;

/**
 * Convenience initializer.
 * Instanciates a Surface object with given `bridge`, `moduleName`, and
 * `initialProperties`, and then use it to instanciate a view.
 */
- (instancetype)initWithBridge:(ABI28_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties;

/**
 * Create an instance of ABI28_0_0RCTSurface to be hosted.
 */
- (ABI28_0_0RCTSurface *)createSurfaceWithBridge:(ABI28_0_0RCTBridge *)bridge
                             moduleName:(NSString *)moduleName
                      initialProperties:(NSDictionary *)initialProperties;

/**
 * Surface object which is currently using to power the view.
 * Read-only.
 */
@property (nonatomic, strong, readonly) ABI28_0_0RCTSurface *surface;

/**
 * Size measure mode which are defining relationship between UIKit and ReactABI28_0_0Native
 * layout approaches.
 * Defaults to `ABI28_0_0RCTSurfaceSizeMeasureModeWidthAtMost | ABI28_0_0RCTSurfaceSizeMeasureModeHeightAtMost`.
 */
@property (nonatomic, assign) ABI28_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode;

/**
 * Activity indicator factory.
 * A hosting view may use this block to instantiate and display custom activity
 * (loading) indicator (aka "spinner") when it needed.
 * Defaults to `nil` (no activity indicator).
 */
@property (nonatomic, copy, nullable) ABI28_0_0RCTSurfaceHostingViewActivityIndicatorViewFactory activityIndicatorViewFactory;

@end

NS_ASSUME_NONNULL_END
