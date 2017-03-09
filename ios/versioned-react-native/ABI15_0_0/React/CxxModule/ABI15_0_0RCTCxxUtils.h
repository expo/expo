/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI15_0_0/ABI15_0_0RCTConvert.h>
#include <folly/dynamic.h>

id ABI15_0_0RCTConvertFollyDynamic(const folly::dynamic &dyn);

@interface ABI15_0_0RCTConvert (folly)

+ (folly::dynamic)folly_dynamic:(id)json;

@end
