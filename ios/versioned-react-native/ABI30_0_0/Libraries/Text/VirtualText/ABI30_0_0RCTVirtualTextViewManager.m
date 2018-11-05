/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTVirtualTextViewManager.h"

#import "ABI30_0_0RCTVirtualTextShadowView.h"

@implementation ABI30_0_0RCTVirtualTextViewManager

ABI30_0_0RCT_EXPORT_MODULE(ABI30_0_0RCTVirtualText)

- (UIView *)view
{
  return [UIView new];
}

- (ABI30_0_0RCTShadowView *)shadowView
{
  return [ABI30_0_0RCTVirtualTextShadowView new];
}

@end
