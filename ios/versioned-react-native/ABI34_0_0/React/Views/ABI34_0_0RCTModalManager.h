/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI34_0_0/ABI34_0_0RCTBridgeModule.h>
#import <ReactABI34_0_0/ABI34_0_0RCTEventEmitter.h>

@interface ABI34_0_0RCTModalManager : ABI34_0_0RCTEventEmitter <ABI34_0_0RCTBridgeModule>

- (void)modalDismissed:(NSNumber *)modalID;

@end
