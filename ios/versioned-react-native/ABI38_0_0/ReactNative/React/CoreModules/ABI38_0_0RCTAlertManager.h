/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI38_0_0React/ABI38_0_0RCTBridgeModule.h>
#import <ABI38_0_0React/ABI38_0_0RCTInvalidating.h>

typedef NS_ENUM(NSInteger, ABI38_0_0RCTAlertViewStyle) {
  ABI38_0_0RCTAlertViewStyleDefault = 0,
  ABI38_0_0RCTAlertViewStyleSecureTextInput,
  ABI38_0_0RCTAlertViewStylePlainTextInput,
  ABI38_0_0RCTAlertViewStyleLoginAndPasswordInput
};


@interface ABI38_0_0RCTAlertManager : NSObject <ABI38_0_0RCTBridgeModule, ABI38_0_0RCTInvalidating>

@end
