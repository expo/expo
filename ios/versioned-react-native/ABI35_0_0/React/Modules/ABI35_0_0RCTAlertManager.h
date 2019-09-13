/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI35_0_0/ABI35_0_0RCTBridgeModule.h>
#import <ReactABI35_0_0/ABI35_0_0RCTInvalidating.h>

typedef NS_ENUM(NSInteger, ABI35_0_0RCTAlertViewStyle) {
  ABI35_0_0RCTAlertViewStyleDefault = 0,
  ABI35_0_0RCTAlertViewStyleSecureTextInput,
  ABI35_0_0RCTAlertViewStylePlainTextInput,
  ABI35_0_0RCTAlertViewStyleLoginAndPasswordInput
};


@interface ABI35_0_0RCTAlertManager : NSObject <ABI35_0_0RCTBridgeModule, ABI35_0_0RCTInvalidating>

@end
