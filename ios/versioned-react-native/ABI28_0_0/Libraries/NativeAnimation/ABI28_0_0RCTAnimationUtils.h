/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

#import <ReactABI28_0_0/ABI28_0_0RCTDefines.h>

static NSString *const ABI28_0_0EXTRAPOLATE_TYPE_IDENTITY = @"identity";
static NSString *const ABI28_0_0EXTRAPOLATE_TYPE_CLAMP = @"clamp";
static NSString *const ABI28_0_0EXTRAPOLATE_TYPE_EXTEND = @"extend";

ABI28_0_0RCT_EXTERN CGFloat ABI28_0_0RCTInterpolateValueInRange(CGFloat value,
                                              NSArray<NSNumber *> *inputRange,
                                              NSArray<NSNumber *> *outputRange,
                                              NSString *extrapolateLeft,
                                              NSString *extrapolateRight);

ABI28_0_0RCT_EXTERN CGFloat ABI28_0_0RCTInterpolateValue(CGFloat value,
                                       CGFloat inputMin,
                                       CGFloat inputMax,
                                       CGFloat outputMin,
                                       CGFloat outputMax,
                                       NSString *extrapolateLeft,
                                       NSString *extrapolateRight);

ABI28_0_0RCT_EXTERN CGFloat ABI28_0_0RCTRadiansToDegrees(CGFloat radians);
ABI28_0_0RCT_EXTERN CGFloat ABI28_0_0RCTDegreesToRadians(CGFloat degrees);
