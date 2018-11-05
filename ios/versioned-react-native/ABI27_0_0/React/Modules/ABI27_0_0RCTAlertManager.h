/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI27_0_0/ABI27_0_0RCTBridgeModule.h>
#import <ReactABI27_0_0/ABI27_0_0RCTInvalidating.h>

typedef NS_ENUM(NSInteger, ABI27_0_0RCTAlertViewStyle) {
  ABI27_0_0RCTAlertViewStyleDefault = 0,
  ABI27_0_0RCTAlertViewStyleSecureTextInput,
  ABI27_0_0RCTAlertViewStylePlainTextInput,
  ABI27_0_0RCTAlertViewStyleLoginAndPasswordInput
};


@interface ABI27_0_0RCTAlertManager : NSObject <ABI27_0_0RCTBridgeModule, ABI27_0_0RCTInvalidating>

@end
