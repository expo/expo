/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI30_0_0/ABI30_0_0RCTBridgeModule.h>
#import <ReactABI30_0_0/ABI30_0_0RCTEventEmitter.h>

@interface ABI30_0_0RCTModalManager : ABI30_0_0RCTEventEmitter <ABI30_0_0RCTBridgeModule>

- (void)modalDismissed:(NSNumber *)modalID;

@end
