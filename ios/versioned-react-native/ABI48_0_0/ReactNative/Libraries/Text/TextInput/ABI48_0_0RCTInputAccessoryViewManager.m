/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0React/ABI48_0_0RCTInputAccessoryViewManager.h>

#import <ABI48_0_0React/ABI48_0_0RCTInputAccessoryShadowView.h>
#import <ABI48_0_0React/ABI48_0_0RCTInputAccessoryView.h>

@implementation ABI48_0_0RCTInputAccessoryViewManager

ABI48_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (UIView *)view
{
  return [[ABI48_0_0RCTInputAccessoryView alloc] initWithBridge:self.bridge];
}

- (ABI48_0_0RCTShadowView *)shadowView
{
  return [ABI48_0_0RCTInputAccessoryShadowView new];
}

ABI48_0_0RCT_REMAP_VIEW_PROPERTY(backgroundColor, inputAccessoryView.backgroundColor, UIColor)

@end
