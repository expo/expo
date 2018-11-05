/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ReactABI27_0_0/ABI27_0_0RCTBridgeModule.h>
#import <ReactABI27_0_0/ABI27_0_0RCTFrameUpdate.h>
#import <ReactABI27_0_0/ABI27_0_0RCTInvalidating.h>

@interface ABI27_0_0RCTTiming : NSObject <ABI27_0_0RCTBridgeModule, ABI27_0_0RCTInvalidating, ABI27_0_0RCTFrameUpdateObserver>

@end
