/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI15_0_0RCTCxxUtils.h"

#import <ReactABI15_0_0/ABI15_0_0RCTFollyConvert.h>

using namespace ReactABI15_0_0::CxxUtils;

id ABI15_0_0RCTConvertFollyDynamic(const folly::dynamic &dyn) {
  return convertFollyDynamicToId(dyn);
}

@implementation ABI15_0_0RCTConvert (folly)

+ (folly::dynamic)folly_dynamic:(id)json;
{
  if (json == nil || json == (id)kCFNull) {
    return nullptr;
  } else {
    folly::dynamic dyn = convertIdToFollyDynamic(json);
     if (dyn == nil) {
       ABI15_0_0RCTAssert(false, @"ABI15_0_0RCTConvert input json is of an impossible type");
     }
     return dyn;
  }
}

@end
