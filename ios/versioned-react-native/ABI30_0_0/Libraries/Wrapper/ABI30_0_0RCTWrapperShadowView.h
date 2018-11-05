// Copyright (c) 2004-present, Facebook, Inc.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#import <UIKit/UIKit.h>

#import <ReactABI30_0_0/ABI30_0_0RCTShadowView.h>

@class ABI30_0_0RCTBridge;

NS_ASSUME_NONNULL_BEGIN

@interface ABI30_0_0RCTWrapperShadowView : ABI30_0_0RCTShadowView

- (instancetype)initWithBridge:(ABI30_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END
