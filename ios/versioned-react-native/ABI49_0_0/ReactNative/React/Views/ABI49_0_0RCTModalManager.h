/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>
#import <ABI49_0_0React/ABI49_0_0RCTEventEmitter.h>

@interface ABI49_0_0RCTModalManager : ABI49_0_0RCTEventEmitter <ABI49_0_0RCTBridgeModule>

- (void)modalDismissed:(NSNumber *)modalID;

@end
