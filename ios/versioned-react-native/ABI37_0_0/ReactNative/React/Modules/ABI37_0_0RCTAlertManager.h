/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI37_0_0React/ABI37_0_0RCTBridgeModule.h>
#import <ABI37_0_0React/ABI37_0_0RCTInvalidating.h>

typedef NS_ENUM(NSInteger, ABI37_0_0RCTAlertViewStyle) {
  ABI37_0_0RCTAlertViewStyleDefault = 0,
  ABI37_0_0RCTAlertViewStyleSecureTextInput,
  ABI37_0_0RCTAlertViewStylePlainTextInput,
  ABI37_0_0RCTAlertViewStyleLoginAndPasswordInput
};


@interface ABI37_0_0RCTAlertManager : NSObject <ABI37_0_0RCTBridgeModule, ABI37_0_0RCTInvalidating>

@end
