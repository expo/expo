/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI38_0_0React/ABI38_0_0RCTBridgeModule.h>
#import <ABI38_0_0React/ABI38_0_0RCTEventEmitter.h>

@interface ABI38_0_0RCTModalManager : ABI38_0_0RCTEventEmitter <ABI38_0_0RCTBridgeModule>

- (void)modalDismissed:(NSNumber *)modalID;

@end
