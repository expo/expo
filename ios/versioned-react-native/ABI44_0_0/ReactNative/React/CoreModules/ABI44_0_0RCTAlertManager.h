/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI44_0_0React/ABI44_0_0RCTBridgeModule.h>
#import <ABI44_0_0React/ABI44_0_0RCTInvalidating.h>

typedef NS_ENUM(NSInteger, ABI44_0_0RCTAlertViewStyle) {
  ABI44_0_0RCTAlertViewStyleDefault = 0,
  ABI44_0_0RCTAlertViewStyleSecureTextInput,
  ABI44_0_0RCTAlertViewStylePlainTextInput,
  ABI44_0_0RCTAlertViewStyleLoginAndPasswordInput
};

@interface ABI44_0_0RCTAlertManager : NSObject <ABI44_0_0RCTBridgeModule, ABI44_0_0RCTInvalidating>

@end
