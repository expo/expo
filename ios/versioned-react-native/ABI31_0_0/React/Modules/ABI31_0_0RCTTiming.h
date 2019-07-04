/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ReactABI31_0_0/ABI31_0_0RCTBridgeModule.h>
#import <ReactABI31_0_0/ABI31_0_0RCTFrameUpdate.h>
#import <ReactABI31_0_0/ABI31_0_0RCTInvalidating.h>

@interface ABI31_0_0RCTTiming : NSObject <ABI31_0_0RCTBridgeModule, ABI31_0_0RCTInvalidating, ABI31_0_0RCTFrameUpdateObserver>

@end
