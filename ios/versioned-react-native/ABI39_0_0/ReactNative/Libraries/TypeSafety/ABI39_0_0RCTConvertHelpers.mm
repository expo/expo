/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RCTConvertHelpers.h"

#import <ABI39_0_0React/ABI39_0_0RCTConvert.h>

bool ABI39_0_0RCTBridgingToBool(id value)
{
  return [ABI39_0_0RCTConvert BOOL:value] ? true : false;
}

folly::Optional<bool> ABI39_0_0RCTBridgingToOptionalBool(id value)
{
  if (!ABI39_0_0RCTNilIfNull(value)) {
    return {};
  }
  return ABI39_0_0RCTBridgingToBool(value);
}

NSString *ABI39_0_0RCTBridgingToString(id value)
{
  return [ABI39_0_0RCTConvert NSString:ABI39_0_0RCTNilIfNull(value)];
}

folly::Optional<double> ABI39_0_0RCTBridgingToOptionalDouble(id value)
{
  if (!ABI39_0_0RCTNilIfNull(value)) {
    return {};
  }
  return ABI39_0_0RCTBridgingToDouble(value);
}

double ABI39_0_0RCTBridgingToDouble(id value)
{
  return [ABI39_0_0RCTConvert double:value];
}

NSArray *ABI39_0_0RCTBridgingToArray(id value) {
  return [ABI39_0_0RCTConvert NSArray:value];
}
