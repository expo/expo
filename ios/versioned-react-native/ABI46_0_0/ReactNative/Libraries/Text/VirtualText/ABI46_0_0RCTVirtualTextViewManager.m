/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI46_0_0React/ABI46_0_0RCTVirtualTextViewManager.h>

#import <ABI46_0_0React/ABI46_0_0RCTVirtualTextShadowView.h>

@implementation ABI46_0_0RCTVirtualTextViewManager

ABI46_0_0RCT_EXPORT_MODULE(ABI46_0_0RCTVirtualText)

- (UIView *)view
{
  return [UIView new];
}

- (ABI46_0_0RCTShadowView *)shadowView
{
  return [ABI46_0_0RCTVirtualTextShadowView new];
}

@end
