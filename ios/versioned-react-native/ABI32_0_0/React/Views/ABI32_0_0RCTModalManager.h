/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI32_0_0/ABI32_0_0RCTBridgeModule.h>
#import <ReactABI32_0_0/ABI32_0_0RCTEventEmitter.h>

@interface ABI32_0_0RCTModalManager : ABI32_0_0RCTEventEmitter <ABI32_0_0RCTBridgeModule>

- (void)modalDismissed:(NSNumber *)modalID;

@end
