/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ReactABI33_0_0/ABI33_0_0RCTBridgeModule.h>
#import <ReactABI33_0_0/ABI33_0_0RCTFrameUpdate.h>
#import <ReactABI33_0_0/ABI33_0_0RCTInvalidating.h>

@interface ABI33_0_0RCTTiming : NSObject <ABI33_0_0RCTBridgeModule, ABI33_0_0RCTInvalidating, ABI33_0_0RCTFrameUpdateObserver>

@end
