/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <ABI49_0_0React/utils/ABI49_0_0ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI49_0_0RCTSurfacePresenter;
@class ABI49_0_0RCTBridge;

/*
 * Controls a life-cycle of a Surface Presenter based on Bridge's life-cycle.
 * We are moving away from using Bridge.
 * This class is intended to be used only during the transition period.
 */
@interface ABI49_0_0RCTSurfacePresenterBridgeAdapter : NSObject

- (instancetype)initWithBridge:(ABI49_0_0RCTBridge *)bridge
              contextContainer:(ABI49_0_0facebook::ABI49_0_0React::ContextContainer::Shared)contextContainer;

/*
 * Returns a stored instance of Surface Presenter which is managed by a bridge.
 */
@property (nonatomic, readonly) ABI49_0_0RCTSurfacePresenter *surfacePresenter;

/*
 * Controls a stored instance of the Bridge. A consumer can re-set the stored Bridge using that method; the class is
 * responsible to coordinate this change with a SurfacePresenter accordingly.
 */
@property (nonatomic, weak) ABI49_0_0RCTBridge *bridge;

@end

NS_ASSUME_NONNULL_END
