/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RCTVirtualTextViewManager.h"

#import "ABI33_0_0RCTVirtualTextShadowView.h"

@implementation ABI33_0_0RCTVirtualTextViewManager

ABI33_0_0RCT_EXPORT_MODULE(ABI33_0_0RCTVirtualText)

- (UIView *)view
{
  return [UIView new];
}

- (ABI33_0_0RCTShadowView *)shadowView
{
  return [ABI33_0_0RCTVirtualTextShadowView new];
}

@end
