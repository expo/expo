/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ReactABI34_0_0/ABI34_0_0RCTBridgeModule.h>
#import <ReactABI34_0_0/ABI34_0_0RCTFrameUpdate.h>
#import <ReactABI34_0_0/ABI34_0_0RCTInvalidating.h>

@interface ABI34_0_0RCTTiming : NSObject <ABI34_0_0RCTBridgeModule, ABI34_0_0RCTInvalidating, ABI34_0_0RCTFrameUpdateObserver>

@end
