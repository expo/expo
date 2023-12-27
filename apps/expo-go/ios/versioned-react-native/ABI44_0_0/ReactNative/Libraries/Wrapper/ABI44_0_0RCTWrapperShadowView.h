/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI44_0_0React/ABI44_0_0RCTShadowView.h>

@class ABI44_0_0RCTBridge;

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0RCTWrapperShadowView : ABI44_0_0RCTShadowView

- (instancetype)initWithBridge:(ABI44_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END
