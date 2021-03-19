/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI41_0_0React/ABI41_0_0RCTBridgeModule.h>
#import <ABI41_0_0React/ABI41_0_0RCTInvalidating.h>

typedef NS_ENUM(NSInteger, ABI41_0_0RCTAlertViewStyle) {
  ABI41_0_0RCTAlertViewStyleDefault = 0,
  ABI41_0_0RCTAlertViewStyleSecureTextInput,
  ABI41_0_0RCTAlertViewStylePlainTextInput,
  ABI41_0_0RCTAlertViewStyleLoginAndPasswordInput
};

@interface ABI41_0_0RCTAlertManager : NSObject <ABI41_0_0RCTBridgeModule, ABI41_0_0RCTInvalidating>

@end
