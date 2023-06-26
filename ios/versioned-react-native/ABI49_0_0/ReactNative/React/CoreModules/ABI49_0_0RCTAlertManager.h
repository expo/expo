/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>
#import <ABI49_0_0React/ABI49_0_0RCTInvalidating.h>

typedef NS_ENUM(NSInteger, ABI49_0_0RCTAlertViewStyle) {
  ABI49_0_0RCTAlertViewStyleDefault = 0,
  ABI49_0_0RCTAlertViewStyleSecureTextInput,
  ABI49_0_0RCTAlertViewStylePlainTextInput,
  ABI49_0_0RCTAlertViewStyleLoginAndPasswordInput
};

@interface ABI49_0_0RCTAlertManager : NSObject <ABI49_0_0RCTBridgeModule, ABI49_0_0RCTInvalidating>

@end
