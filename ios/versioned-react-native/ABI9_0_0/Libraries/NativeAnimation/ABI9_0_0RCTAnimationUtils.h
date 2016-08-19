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

#import "ABI9_0_0RCTDefines.h"

ABI9_0_0RCT_EXTERN CGFloat ABI9_0_0RCTInterpolateValue(CGFloat value,
                                       CGFloat fromMin,
                                       CGFloat fromMax,
                                       CGFloat toMin,
                                       CGFloat toMax);

ABI9_0_0RCT_EXTERN CGFloat ABI9_0_0RCTRadiansToDegrees(CGFloat radians);
ABI9_0_0RCT_EXTERN CGFloat ABI9_0_0RCTDegreesToRadians(CGFloat degrees);
