/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RCTVirtualTextViewManager.h"

#import "ABI35_0_0RCTVirtualTextShadowView.h"

@implementation ABI35_0_0RCTVirtualTextViewManager

ABI35_0_0RCT_EXPORT_MODULE(ABI35_0_0RCTVirtualText)

- (UIView *)view
{
  return [UIView new];
}

- (ABI35_0_0RCTShadowView *)shadowView
{
  return [ABI35_0_0RCTVirtualTextShadowView new];
}

@end
