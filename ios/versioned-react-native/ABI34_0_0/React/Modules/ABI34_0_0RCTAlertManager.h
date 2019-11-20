/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI34_0_0/ABI34_0_0RCTBridgeModule.h>
#import <ReactABI34_0_0/ABI34_0_0RCTInvalidating.h>

typedef NS_ENUM(NSInteger, ABI34_0_0RCTAlertViewStyle) {
  ABI34_0_0RCTAlertViewStyleDefault = 0,
  ABI34_0_0RCTAlertViewStyleSecureTextInput,
  ABI34_0_0RCTAlertViewStylePlainTextInput,
  ABI34_0_0RCTAlertViewStyleLoginAndPasswordInput
};


@interface ABI34_0_0RCTAlertManager : NSObject <ABI34_0_0RCTBridgeModule, ABI34_0_0RCTInvalidating>

@end
