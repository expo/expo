// Copyright (c) 2004-present, Facebook, Inc.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#import <UIKit/UIKit.h>

#import <ReactABI31_0_0/ABI31_0_0RCTShadowView.h>

@class ABI31_0_0RCTBridge;

NS_ASSUME_NONNULL_BEGIN

@interface ABI31_0_0RCTWrapperShadowView : ABI31_0_0RCTShadowView

- (instancetype)initWithBridge:(ABI31_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END
