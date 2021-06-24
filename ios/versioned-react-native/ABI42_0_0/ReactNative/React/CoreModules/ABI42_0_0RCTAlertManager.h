/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTBridgeModule.h>
#import <ABI42_0_0React/ABI42_0_0RCTInvalidating.h>

typedef NS_ENUM(NSInteger, ABI42_0_0RCTAlertViewStyle) {
  ABI42_0_0RCTAlertViewStyleDefault = 0,
  ABI42_0_0RCTAlertViewStyleSecureTextInput,
  ABI42_0_0RCTAlertViewStylePlainTextInput,
  ABI42_0_0RCTAlertViewStyleLoginAndPasswordInput
};

@interface ABI42_0_0RCTAlertManager : NSObject <ABI42_0_0RCTBridgeModule, ABI42_0_0RCTInvalidating>

@end
