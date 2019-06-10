/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI33_0_0/ABI33_0_0RCTBridgeModule.h>
#import <ReactABI33_0_0/ABI33_0_0RCTEventEmitter.h>

@interface ABI33_0_0RCTModalManager : ABI33_0_0RCTEventEmitter <ABI33_0_0RCTBridgeModule>

- (void)modalDismissed:(NSNumber *)modalID;

@end
