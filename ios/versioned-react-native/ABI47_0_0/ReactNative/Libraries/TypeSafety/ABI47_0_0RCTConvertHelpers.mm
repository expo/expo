/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTConvertHelpers.h"

#import <ABI47_0_0React/ABI47_0_0RCTConvert.h>

bool ABI47_0_0RCTBridgingToBool(id value)
{
  return [ABI47_0_0RCTConvert BOOL:value] ? true : false;
}

std::optional<bool> ABI47_0_0RCTBridgingToOptionalBool(id value)
{
  if (!ABI47_0_0RCTNilIfNull(value)) {
    return {};
  }
  return ABI47_0_0RCTBridgingToBool(value);
}

NSString *ABI47_0_0RCTBridgingToString(id value)
{
  return [ABI47_0_0RCTConvert NSString:ABI47_0_0RCTNilIfNull(value)];
}

NSString *ABI47_0_0RCTBridgingToOptionalString(id value)
{
  return ABI47_0_0RCTBridgingToString(value);
}


std::optional<double> ABI47_0_0RCTBridgingToOptionalDouble(id value)
{
  if (!ABI47_0_0RCTNilIfNull(value)) {
    return {};
  }
  return ABI47_0_0RCTBridgingToDouble(value);
}

double ABI47_0_0RCTBridgingToDouble(id value)
{
  return [ABI47_0_0RCTConvert double:value];
}

NSArray *ABI47_0_0RCTBridgingToArray(id value) {
  return [ABI47_0_0RCTConvert NSArray:value];
}
