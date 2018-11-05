/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ReactABI29_0_0/ABI29_0_0RCTBridgeModule.h>
#import <ReactABI29_0_0/ABI29_0_0RCTFrameUpdate.h>
#import <ReactABI29_0_0/ABI29_0_0RCTInvalidating.h>

@interface ABI29_0_0RCTTiming : NSObject <ABI29_0_0RCTBridgeModule, ABI29_0_0RCTInvalidating, ABI29_0_0RCTFrameUpdateObserver>

@end
