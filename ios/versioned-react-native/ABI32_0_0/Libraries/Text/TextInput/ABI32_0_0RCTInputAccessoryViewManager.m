/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTInputAccessoryViewManager.h"

#import "ABI32_0_0RCTInputAccessoryShadowView.h"
#import "ABI32_0_0RCTInputAccessoryView.h"

@implementation ABI32_0_0RCTInputAccessoryViewManager

ABI32_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (UIView *)view
{
  return [[ABI32_0_0RCTInputAccessoryView alloc] initWithBridge:self.bridge];
}

- (ABI32_0_0RCTShadowView *)shadowView
{
  return [ABI32_0_0RCTInputAccessoryShadowView new];
}

ABI32_0_0RCT_REMAP_VIEW_PROPERTY(backgroundColor, inputAccessoryView.backgroundColor, UIColor)

@end
