/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI36_0_0React/ABI36_0_0RCTBridgeModule.h>
#import <ABI36_0_0React/ABI36_0_0RCTFrameUpdate.h>
#import <ABI36_0_0React/ABI36_0_0RCTInvalidating.h>

@interface ABI36_0_0RCTTiming : NSObject <ABI36_0_0RCTBridgeModule, ABI36_0_0RCTInvalidating, ABI36_0_0RCTFrameUpdateObserver>

@end
