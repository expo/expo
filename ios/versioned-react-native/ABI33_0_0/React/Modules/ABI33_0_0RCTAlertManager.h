/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI33_0_0/ABI33_0_0RCTBridgeModule.h>
#import <ReactABI33_0_0/ABI33_0_0RCTInvalidating.h>

typedef NS_ENUM(NSInteger, ABI33_0_0RCTAlertViewStyle) {
  ABI33_0_0RCTAlertViewStyleDefault = 0,
  ABI33_0_0RCTAlertViewStyleSecureTextInput,
  ABI33_0_0RCTAlertViewStylePlainTextInput,
  ABI33_0_0RCTAlertViewStyleLoginAndPasswordInput
};


@interface ABI33_0_0RCTAlertManager : NSObject <ABI33_0_0RCTBridgeModule, ABI33_0_0RCTInvalidating>

@end
