/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTBridgeModule.h>
#import <ABI48_0_0React/ABI48_0_0RCTEventEmitter.h>

@interface ABI48_0_0RCTModalManager : ABI48_0_0RCTEventEmitter <ABI48_0_0RCTBridgeModule>

- (void)modalDismissed:(NSNumber *)modalID;

@end
