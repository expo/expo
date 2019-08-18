/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI32_0_0/ABI32_0_0RCTBridgeModule.h>
#import <ReactABI32_0_0/ABI32_0_0RCTInvalidating.h>

typedef NS_ENUM(NSInteger, ABI32_0_0RCTAlertViewStyle) {
  ABI32_0_0RCTAlertViewStyleDefault = 0,
  ABI32_0_0RCTAlertViewStyleSecureTextInput,
  ABI32_0_0RCTAlertViewStylePlainTextInput,
  ABI32_0_0RCTAlertViewStyleLoginAndPasswordInput
};


@interface ABI32_0_0RCTAlertManager : NSObject <ABI32_0_0RCTBridgeModule, ABI32_0_0RCTInvalidating>

@end
