/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0React/ABI48_0_0RCTVirtualTextViewManager.h>

#import <ABI48_0_0React/ABI48_0_0RCTVirtualTextShadowView.h>

@implementation ABI48_0_0RCTVirtualTextViewManager

ABI48_0_0RCT_EXPORT_MODULE(ABI48_0_0RCTVirtualText)

- (UIView *)view
{
  return [UIView new];
}

- (ABI48_0_0RCTShadowView *)shadowView
{
  return [ABI48_0_0RCTVirtualTextShadowView new];
}

@end
