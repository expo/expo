/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTAnimationUtils.h"

#import <ReactABI30_0_0/ABI30_0_0RCTLog.h>

static NSUInteger _ABI30_0_0RCTFindIndexOfNearestValue(CGFloat value, NSArray<NSNumber *> *range)
{
  NSUInteger index;
  NSUInteger rangeCount = range.count;
  for (index = 1; index < rangeCount - 1; index++) {
    NSNumber *inputValue = range[index];
    if (inputValue.doubleValue >= value) {
      break;
    }
  }
  return index - 1;
}

/**
 * Interpolates value by remapping it linearly fromMin->fromMax to toMin->toMax
 */
CGFloat ABI30_0_0RCTInterpolateValue(CGFloat value,
                            CGFloat inputMin,
                            CGFloat inputMax,
                            CGFloat outputMin,
                            CGFloat outputMax,
                            NSString *extrapolateLeft,
                            NSString *extrapolateRight)
{
  if (value < inputMin) {
    if ([extrapolateLeft isEqualToString:ABI30_0_0EXTRAPOLATE_TYPE_IDENTITY]) {
      return value;
    } else if ([extrapolateLeft isEqualToString:ABI30_0_0EXTRAPOLATE_TYPE_CLAMP]) {
      value = inputMin;
    } else if ([extrapolateLeft isEqualToString:ABI30_0_0EXTRAPOLATE_TYPE_EXTEND]) {
      // noop
    } else {
      ABI30_0_0RCTLogError(@"Invalid extrapolation type %@ for left extrapolation", extrapolateLeft);
    }
  }

  if (value > inputMax) {
    if ([extrapolateRight isEqualToString:ABI30_0_0EXTRAPOLATE_TYPE_IDENTITY]) {
      return value;
    } else if ([extrapolateRight isEqualToString:ABI30_0_0EXTRAPOLATE_TYPE_CLAMP]) {
      value = inputMax;
    } else if ([extrapolateRight isEqualToString:ABI30_0_0EXTRAPOLATE_TYPE_EXTEND]) {
      // noop
    } else {
      ABI30_0_0RCTLogError(@"Invalid extrapolation type %@ for right extrapolation", extrapolateRight);
    }
  }

  return outputMin + (value - inputMin) * (outputMax - outputMin) / (inputMax - inputMin);
}

/**
 * Interpolates value by mapping it from the inputRange to the outputRange.
 */
CGFloat ABI30_0_0RCTInterpolateValueInRange(CGFloat value,
                                   NSArray<NSNumber *> *inputRange,
                                   NSArray<NSNumber *> *outputRange,
                                   NSString *extrapolateLeft,
                                   NSString *extrapolateRight)
{
  NSUInteger rangeIndex = _ABI30_0_0RCTFindIndexOfNearestValue(value, inputRange);
  CGFloat inputMin = inputRange[rangeIndex].doubleValue;
  CGFloat inputMax = inputRange[rangeIndex + 1].doubleValue;
  CGFloat outputMin = outputRange[rangeIndex].doubleValue;
  CGFloat outputMax = outputRange[rangeIndex + 1].doubleValue;

  return ABI30_0_0RCTInterpolateValue(value,
                             inputMin,
                             inputMax,
                             outputMin,
                             outputMax,
                             extrapolateLeft,
                             extrapolateRight);
}

CGFloat ABI30_0_0RCTRadiansToDegrees(CGFloat radians)
{
  return radians * 180.0 / M_PI;
}

CGFloat ABI30_0_0RCTDegreesToRadians(CGFloat degrees)
{
  return degrees / 180.0 * M_PI;
}
