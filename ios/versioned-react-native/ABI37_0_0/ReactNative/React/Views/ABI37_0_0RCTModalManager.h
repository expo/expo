/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI37_0_0React/ABI37_0_0RCTBridgeModule.h>
#import <ABI37_0_0React/ABI37_0_0RCTEventEmitter.h>

@interface ABI37_0_0RCTModalManager : ABI37_0_0RCTEventEmitter <ABI37_0_0RCTBridgeModule>

- (void)modalDismissed:(NSNumber *)modalID;

@end
