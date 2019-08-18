/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <memory>

#import <ReactABI32_0_0/ABI32_0_0RCTBridge.h>
#import <ReactABI32_0_0/ABI32_0_0RCTPrimitives.h>
#import <ABI32_0_0fabric/ABI32_0_0uimanager/FabricUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI32_0_0RCTFabricSurface;
@class ABI32_0_0RCTMountingManager;

/**
 * Coordinates presenting of ReactABI32_0_0 Native Surfaces and represents application
 * facing interface of running ReactABI32_0_0 Native core.
 * SurfacePresenter incapsulates a bridge object inside and discourage direct
 * access to it.
 */
@interface ABI32_0_0RCTSurfacePresenter : NSObject

- (instancetype)initWithBridge:(ABI32_0_0RCTBridge *)bridge;

@end

@interface ABI32_0_0RCTSurfacePresenter (Surface)

/**
 * Surface uses those methods to register itself in the Presenter.
 * Registering initiates running, rendering and mounting processes.
 */
- (void)registerSurface:(ABI32_0_0RCTFabricSurface *)surface;
- (void)unregisterSurface:(ABI32_0_0RCTFabricSurface *)surface;
- (nullable ABI32_0_0RCTFabricSurface *)surfaceForRootTag:(ReactABI32_0_0Tag)rootTag;

/**
 * Measures the Surface with given constraints.
 */
- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize
                          surface:(ABI32_0_0RCTFabricSurface *)surface;

/**
 * Sets `minimumSize` and `maximumSize` layout constraints for the Surface.
 */
- (void)setMinimumSize:(CGSize)minimumSize
           maximumSize:(CGSize)maximumSize
               surface:(ABI32_0_0RCTFabricSurface *)surface;

@end

@interface ABI32_0_0RCTSurfacePresenter (Deprecated)

/**
 * We need to expose `uiManager` for registration
 * purposes. Eventually, we will move this down to C++ side.
 */
- (std::shared_ptr<facebook::ReactABI32_0_0::FabricUIManager>)uiManager_DO_NOT_USE;

/**
 * Returns a underlying bridge.
 */
- (ABI32_0_0RCTBridge *)bridge_DO_NOT_USE;

@end

@interface ABI32_0_0RCTBridge (ABI32_0_0RCTSurfacePresenter)

- (ABI32_0_0RCTSurfacePresenter *)surfacePresenter;

@end

NS_ASSUME_NONNULL_END
