/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI40_0_0React/ABI40_0_0RCTBridge.h>
#import <ABI40_0_0React/ABI40_0_0RCTBridgeModule.h>
#import <ABI40_0_0React/ABI40_0_0RCTErrorCustomizer.h>

@class ABI40_0_0RCTJSStackFrame;

@interface ABI40_0_0RCTLogBox : NSObject <ABI40_0_0RCTBridgeModule>

- (void)show;
- (void)hide;

@end
