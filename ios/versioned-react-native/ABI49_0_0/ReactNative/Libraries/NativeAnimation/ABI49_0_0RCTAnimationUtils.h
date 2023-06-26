/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

#import <ABI49_0_0React/ABI49_0_0RCTDefines.h>

ABI49_0_0RCT_EXTERN NSString *const ABI49_0_0EXTRAPOLATE_TYPE_IDENTITY;
ABI49_0_0RCT_EXTERN NSString *const ABI49_0_0EXTRAPOLATE_TYPE_CLAMP;
ABI49_0_0RCT_EXTERN NSString *const ABI49_0_0EXTRAPOLATE_TYPE_EXTEND;

ABI49_0_0RCT_EXTERN NSUInteger ABI49_0_0RCTFindIndexOfNearestValue(CGFloat value, NSArray<NSNumber *> *range);

ABI49_0_0RCT_EXTERN CGFloat ABI49_0_0RCTInterpolateValue(
    CGFloat value,
    CGFloat inputMin,
    CGFloat inputMax,
    CGFloat outputMin,
    CGFloat outputMax,
    NSString *extrapolateLeft,
    NSString *extrapolateRight);

ABI49_0_0RCT_EXTERN CGFloat ABI49_0_0RCTInterpolateValueInRange(
    CGFloat value,
    NSArray<NSNumber *> *inputRange,
    NSArray<NSNumber *> *outputRange,
    NSString *extrapolateLeft,
    NSString *extrapolateRight);

ABI49_0_0RCT_EXTERN uint32_t
ABI49_0_0RCTInterpolateColorInRange(CGFloat value, NSArray<NSNumber *> *inputRange, NSArray<UIColor *> *outputRange);

// Represents a color as a int32_t. RGB components are assumed to be in [0-255] range and alpha in [0-1] range
ABI49_0_0RCT_EXTERN uint32_t ABI49_0_0RCTColorFromComponents(CGFloat red, CGFloat green, CGFloat blue, CGFloat alpha);

/**
 * Coefficient to slow down animations, respects the ios
 * simulator `Slow Animations (⌘T)` option.
 */
ABI49_0_0RCT_EXTERN CGFloat ABI49_0_0RCTAnimationDragCoefficient(void);
