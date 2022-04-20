/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI45_0_0React/ABI45_0_0RCTBridgeModule.h>
#import <ABI45_0_0React/ABI45_0_0RCTInvalidating.h>

typedef NS_ENUM(NSInteger, ABI45_0_0RCTAlertViewStyle) {
  ABI45_0_0RCTAlertViewStyleDefault = 0,
  ABI45_0_0RCTAlertViewStyleSecureTextInput,
  ABI45_0_0RCTAlertViewStylePlainTextInput,
  ABI45_0_0RCTAlertViewStyleLoginAndPasswordInput
};

@interface ABI45_0_0RCTAlertManager : NSObject <ABI45_0_0RCTBridgeModule, ABI45_0_0RCTInvalidating>

@end
