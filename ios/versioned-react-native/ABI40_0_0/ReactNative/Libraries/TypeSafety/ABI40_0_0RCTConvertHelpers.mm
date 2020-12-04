/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RCTConvertHelpers.h"

#import <ABI40_0_0React/ABI40_0_0RCTConvert.h>

bool ABI40_0_0RCTBridgingToBool(id value)
{
  return [ABI40_0_0RCTConvert BOOL:value] ? true : false;
}

folly::Optional<bool> ABI40_0_0RCTBridgingToOptionalBool(id value)
{
  if (!ABI40_0_0RCTNilIfNull(value)) {
    return {};
  }
  return ABI40_0_0RCTBridgingToBool(value);
}

NSString *ABI40_0_0RCTBridgingToString(id value)
{
  return [ABI40_0_0RCTConvert NSString:ABI40_0_0RCTNilIfNull(value)];
}

folly::Optional<double> ABI40_0_0RCTBridgingToOptionalDouble(id value)
{
  if (!ABI40_0_0RCTNilIfNull(value)) {
    return {};
  }
  return ABI40_0_0RCTBridgingToDouble(value);
}

double ABI40_0_0RCTBridgingToDouble(id value)
{
  return [ABI40_0_0RCTConvert double:value];
}

NSArray *ABI40_0_0RCTBridgingToArray(id value) {
  return [ABI40_0_0RCTConvert NSArray:value];
}
