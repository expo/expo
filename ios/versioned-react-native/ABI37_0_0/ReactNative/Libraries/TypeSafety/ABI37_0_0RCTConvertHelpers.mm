/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTConvertHelpers.h"

#import <ABI37_0_0React/ABI37_0_0RCTConvert.h>

bool ABI37_0_0RCTBridgingToBool(id value)
{
  return [ABI37_0_0RCTConvert BOOL:value] ? true : false;
}

folly::Optional<bool> ABI37_0_0RCTBridgingToOptionalBool(id value)
{
  if (!value) {
    return {};
  }
  return ABI37_0_0RCTBridgingToBool(value);
}

NSString *ABI37_0_0RCTBridgingToString(id value)
{
  return [ABI37_0_0RCTConvert NSString:value];
}

folly::Optional<double> ABI37_0_0RCTBridgingToOptionalDouble(id value)
{
  if (!value) {
    return {};
  }
  return ABI37_0_0RCTBridgingToDouble(value);
}

double ABI37_0_0RCTBridgingToDouble(id value)
{
  return [ABI37_0_0RCTConvert double:value];
}

NSArray *ABI37_0_0RCTBridgingToArray(id value) {
  return [ABI37_0_0RCTConvert NSArray:value];
}
