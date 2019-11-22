/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RCTConvertHelpers.h"

#import <ABI36_0_0React/ABI36_0_0RCTConvert.h>

bool ABI36_0_0RCTBridgingToBool(id value)
{
  return [ABI36_0_0RCTConvert BOOL:value] ? true : false;
}

folly::Optional<bool> ABI36_0_0RCTBridgingToOptionalBool(id value)
{
  if (!value) {
    return {};
  }
  return ABI36_0_0RCTBridgingToBool(value);
}

NSString *ABI36_0_0RCTBridgingToString(id value)
{
  return [ABI36_0_0RCTConvert NSString:value];
}

folly::Optional<double> ABI36_0_0RCTBridgingToOptionalDouble(id value)
{
  if (!value) {
    return {};
  }
  return ABI36_0_0RCTBridgingToDouble(value);
}

double ABI36_0_0RCTBridgingToDouble(id value)
{
  return [ABI36_0_0RCTConvert double:value];
}

NSArray *ABI36_0_0RCTBridgingToArray(id value) {
  return [ABI36_0_0RCTConvert NSArray:value];
}
