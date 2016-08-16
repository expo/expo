/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI8_0_0RCTAnimationUtils.h"

/**
 * Interpolates value by remapping it linearly fromMin->fromMax to toMin->toMax
 */
CGFloat ABI8_0_0RCTInterpolateValue(CGFloat value,
                            CGFloat fromMin,
                            CGFloat fromMax,
                            CGFloat toMin,
                            CGFloat toMax)
{
  return toMin + (value - fromMin) * (toMax - toMin) / (fromMax - fromMin);
}

CGFloat ABI8_0_0RCTRadiansToDegrees(CGFloat radians)
{
  return radians * 180.0 / M_PI;
}

CGFloat ABI8_0_0RCTDegreesToRadians(CGFloat degrees)
{
  return degrees / 180.0 * M_PI;
}
