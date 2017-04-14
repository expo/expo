/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <ReactABI16_0_0/ABI16_0_0RCTBridgeModule.h>
#import <ReactABI16_0_0/ABI16_0_0RCTFrameUpdate.h>
#import <ReactABI16_0_0/ABI16_0_0RCTInvalidating.h>

@interface ABI16_0_0RCTTiming : NSObject <ABI16_0_0RCTBridgeModule, ABI16_0_0RCTInvalidating, ABI16_0_0RCTFrameUpdateObserver>

@end
