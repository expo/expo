/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTValueAnimatedNode.h"

#import <ABI49_0_0React/ABI49_0_0RCTDefines.h>

NS_ASSUME_NONNULL_BEGIN

ABI49_0_0RCT_EXTERN NSString *ABI49_0_0RCTInterpolateString(
    NSString *pattern,
    CGFloat inputValue,
    NSArray *inputRange,
    NSArray<NSArray<NSNumber *> *> *outputRange,
    NSString *extrapolateLeft,
    NSString *extrapolateRight);

@interface ABI49_0_0RCTInterpolationAnimatedNode : ABI49_0_0RCTValueAnimatedNode

@end

NS_ASSUME_NONNULL_END
