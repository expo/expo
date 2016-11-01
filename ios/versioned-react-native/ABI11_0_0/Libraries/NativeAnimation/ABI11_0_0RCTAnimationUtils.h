/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>
#import <CoreGraphics/CoreGraphics.h>

#import "ABI11_0_0RCTDefines.h"

static NSString * const ABI11_0_0EXTRAPOLATE_TYPE_IDENTITY = @"identity";
static NSString * const ABI11_0_0EXTRAPOLATE_TYPE_CLAMP = @"clamp";
static NSString * const ABI11_0_0EXTRAPOLATE_TYPE_EXTEND = @"extend";

ABI11_0_0RCT_EXTERN CGFloat ABI11_0_0RCTInterpolateValue(CGFloat value,
                                       CGFloat inputMin,
                                       CGFloat inputMax,
                                       CGFloat outputMin,
                                       CGFloat outputMax,
                                       NSString *extrapolateLeft,
                                       NSString *extrapolateRight);

ABI11_0_0RCT_EXTERN CGFloat ABI11_0_0RCTRadiansToDegrees(CGFloat radians);
ABI11_0_0RCT_EXTERN CGFloat ABI11_0_0RCTDegreesToRadians(CGFloat degrees);
