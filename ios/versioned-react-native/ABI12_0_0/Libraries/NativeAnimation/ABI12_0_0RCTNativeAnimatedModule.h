/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
#import "ABI12_0_0RCTBridgeModule.h"
#import "ABI12_0_0RCTValueAnimatedNode.h"
#import "ABI12_0_0RCTEventEmitter.h"
#import "ABI12_0_0RCTEventDispatcher.h"

@interface ABI12_0_0RCTNativeAnimatedModule : ABI12_0_0RCTEventEmitter <ABI12_0_0RCTBridgeModule, ABI12_0_0RCTValueAnimatedNodeObserver, ABI12_0_0RCTEventDispatcherObserver>

@end
