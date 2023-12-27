/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTConvertHelpers.h"

#import <ABI44_0_0React/ABI44_0_0RCTConvert.h>

bool ABI44_0_0RCTBridgingToBool(id value)
{
  return [ABI44_0_0RCTConvert BOOL:value] ? true : false;
}

folly::Optional<bool> ABI44_0_0RCTBridgingToOptionalBool(id value)
{
  if (!ABI44_0_0RCTNilIfNull(value)) {
    return {};
  }
  return ABI44_0_0RCTBridgingToBool(value);
}

NSString *ABI44_0_0RCTBridgingToString(id value)
{
  return [ABI44_0_0RCTConvert NSString:ABI44_0_0RCTNilIfNull(value)];
}

NSString *ABI44_0_0RCTBridgingToOptionalString(id value)
{
  return ABI44_0_0RCTBridgingToString(value);
}


folly::Optional<double> ABI44_0_0RCTBridgingToOptionalDouble(id value)
{
  if (!ABI44_0_0RCTNilIfNull(value)) {
    return {};
  }
  return ABI44_0_0RCTBridgingToDouble(value);
}

double ABI44_0_0RCTBridgingToDouble(id value)
{
  return [ABI44_0_0RCTConvert double:value];
}

NSArray *ABI44_0_0RCTBridgingToArray(id value) {
  return [ABI44_0_0RCTConvert NSArray:value];
}
