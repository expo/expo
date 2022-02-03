/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI43_0_0React/ABI43_0_0RCTBridgeModule.h>
#import <ABI43_0_0React/ABI43_0_0RCTInvalidating.h>

typedef NS_ENUM(NSInteger, ABI43_0_0RCTAlertViewStyle) {
  ABI43_0_0RCTAlertViewStyleDefault = 0,
  ABI43_0_0RCTAlertViewStyleSecureTextInput,
  ABI43_0_0RCTAlertViewStylePlainTextInput,
  ABI43_0_0RCTAlertViewStyleLoginAndPasswordInput
};

@interface ABI43_0_0RCTAlertManager : NSObject <ABI43_0_0RCTBridgeModule, ABI43_0_0RCTInvalidating>

@end
