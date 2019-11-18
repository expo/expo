/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI36_0_0React/ABI36_0_0RCTBridgeModule.h>
#import <ABI36_0_0React/ABI36_0_0RCTInvalidating.h>

typedef NS_ENUM(NSInteger, ABI36_0_0RCTAlertViewStyle) {
  ABI36_0_0RCTAlertViewStyleDefault = 0,
  ABI36_0_0RCTAlertViewStyleSecureTextInput,
  ABI36_0_0RCTAlertViewStylePlainTextInput,
  ABI36_0_0RCTAlertViewStyleLoginAndPasswordInput
};


@interface ABI36_0_0RCTAlertManager : NSObject <ABI36_0_0RCTBridgeModule, ABI36_0_0RCTInvalidating>

@end
