/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI37_0_0React/ABI37_0_0RCTBridgeModule.h>
#import <ABI37_0_0React/ABI37_0_0RCTFrameUpdate.h>
#import <ABI37_0_0React/ABI37_0_0RCTInvalidating.h>

@interface ABI37_0_0RCTTiming : NSObject <ABI37_0_0RCTBridgeModule, ABI37_0_0RCTInvalidating, ABI37_0_0RCTFrameUpdateObserver>

@end
