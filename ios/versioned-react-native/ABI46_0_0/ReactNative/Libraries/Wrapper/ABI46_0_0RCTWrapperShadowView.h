/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI46_0_0React/ABI46_0_0RCTShadowView.h>

@class ABI46_0_0RCTBridge;

NS_ASSUME_NONNULL_BEGIN

@interface ABI46_0_0RCTWrapperShadowView : ABI46_0_0RCTShadowView

- (instancetype)initWithBridge:(ABI46_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END
