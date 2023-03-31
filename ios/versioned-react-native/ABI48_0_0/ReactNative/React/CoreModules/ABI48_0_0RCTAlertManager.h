/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTBridgeModule.h>
#import <ABI48_0_0React/ABI48_0_0RCTInvalidating.h>

typedef NS_ENUM(NSInteger, ABI48_0_0RCTAlertViewStyle) {
  ABI48_0_0RCTAlertViewStyleDefault = 0,
  ABI48_0_0RCTAlertViewStyleSecureTextInput,
  ABI48_0_0RCTAlertViewStylePlainTextInput,
  ABI48_0_0RCTAlertViewStyleLoginAndPasswordInput
};

@interface ABI48_0_0RCTAlertManager : NSObject <ABI48_0_0RCTBridgeModule, ABI48_0_0RCTInvalidating>

@end
