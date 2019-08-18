/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI32_0_0/ABI32_0_0RCTView.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI32_0_0RCTBridge;

@interface ABI32_0_0RCTSafeAreaView : ABI32_0_0RCTView

- (instancetype)initWithBridge:(ABI32_0_0RCTBridge *)bridge;

@end

NS_ASSUME_NONNULL_END
