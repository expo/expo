/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI44_0_0React/ABI44_0_0RCTBridgeModule.h>
#import <ABI44_0_0React/ABI44_0_0RCTEventEmitter.h>

@interface ABI44_0_0RCTModalManager : ABI44_0_0RCTEventEmitter <ABI44_0_0RCTBridgeModule>

- (void)modalDismissed:(NSNumber *)modalID;

@end
