/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI48_0_0ReactCommon/ABI48_0_0RuntimeExecutor.h>
#import <UIKit/UIKit.h>
#import <ABI48_0_0React/ABI48_0_0utils/ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI48_0_0RCTSurfacePresenter;
@class ABI48_0_0RCTBridge;

ABI48_0_0facebook::ABI48_0_0React::RuntimeExecutor ABI48_0_0RCTRuntimeExecutorFromBridge(ABI48_0_0RCTBridge *bridge);

/*
 * Controls a life-cycle of a Surface Presenter based on Bridge's life-cycle.
 * We are moving away from using Bridge.
 * This class is intended to be used only during the transition period.
 */
@interface ABI48_0_0RCTSurfacePresenterBridgeAdapter : NSObject

- (instancetype)initWithBridge:(ABI48_0_0RCTBridge *)bridge
              contextContainer:(ABI48_0_0facebook::ABI48_0_0React::ContextContainer::Shared)contextContainer;

/*
 * Returns a stored instance of Surface Presenter which is managed by a bridge.
 */
@property (nonatomic, readonly) ABI48_0_0RCTSurfacePresenter *surfacePresenter;

/*
 * Controls a stored instance of the Bridge. A consumer can re-set the stored Bridge using that method; the class is
 * responsible to coordinate this change with a SurfacePresenter accordingly.
 */
@property (nonatomic, weak) ABI48_0_0RCTBridge *bridge;

@end

NS_ASSUME_NONNULL_END
