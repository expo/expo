/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTConvertHelpers.h"

#import <ABI48_0_0React/ABI48_0_0RCTConvert.h>

bool ABI48_0_0RCTBridgingToBool(id value)
{
  return [ABI48_0_0RCTConvert BOOL:value] ? true : false;
}

std::optional<bool> ABI48_0_0RCTBridgingToOptionalBool(id value)
{
  if (!ABI48_0_0RCTNilIfNull(value)) {
    return {};
  }
  return ABI48_0_0RCTBridgingToBool(value);
}

NSString *ABI48_0_0RCTBridgingToString(id value)
{
  return [ABI48_0_0RCTConvert NSString:ABI48_0_0RCTNilIfNull(value)];
}

NSString *ABI48_0_0RCTBridgingToOptionalString(id value)
{
  return ABI48_0_0RCTBridgingToString(value);
}

std::optional<double> ABI48_0_0RCTBridgingToOptionalDouble(id value)
{
  if (!ABI48_0_0RCTNilIfNull(value)) {
    return {};
  }
  return ABI48_0_0RCTBridgingToDouble(value);
}

double ABI48_0_0RCTBridgingToDouble(id value)
{
  return [ABI48_0_0RCTConvert double:value];
}

NSArray *ABI48_0_0RCTBridgingToArray(id value)
{
  return [ABI48_0_0RCTConvert NSArray:value];
}
