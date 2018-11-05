/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI31_0_0/ABI31_0_0RCTBridgeModule.h>
#import <ReactABI31_0_0/ABI31_0_0RCTInvalidating.h>

typedef NS_ENUM(NSInteger, ABI31_0_0RCTAlertViewStyle) {
  ABI31_0_0RCTAlertViewStyleDefault = 0,
  ABI31_0_0RCTAlertViewStyleSecureTextInput,
  ABI31_0_0RCTAlertViewStylePlainTextInput,
  ABI31_0_0RCTAlertViewStyleLoginAndPasswordInput
};


@interface ABI31_0_0RCTAlertManager : NSObject <ABI31_0_0RCTBridgeModule, ABI31_0_0RCTInvalidating>

@end
