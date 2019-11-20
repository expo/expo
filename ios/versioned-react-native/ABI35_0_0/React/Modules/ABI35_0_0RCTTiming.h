/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ReactABI35_0_0/ABI35_0_0RCTBridgeModule.h>
#import <ReactABI35_0_0/ABI35_0_0RCTFrameUpdate.h>
#import <ReactABI35_0_0/ABI35_0_0RCTInvalidating.h>

@interface ABI35_0_0RCTTiming : NSObject <ABI35_0_0RCTBridgeModule, ABI35_0_0RCTInvalidating, ABI35_0_0RCTFrameUpdateObserver>

@end
