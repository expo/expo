/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI47_0_0React/ABI47_0_0RCTShadowView.h>

@class ABI47_0_0RCTBridge;

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0RCTWrapperShadowView : ABI47_0_0RCTShadowView

- (instancetype)initWithBridge:(ABI47_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END
