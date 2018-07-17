/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTVirtualTextViewManager.h"

#import "ABI29_0_0RCTVirtualTextShadowView.h"

@implementation ABI29_0_0RCTVirtualTextViewManager

ABI29_0_0RCT_EXPORT_MODULE(ABI29_0_0RCTVirtualText)

- (UIView *)view
{
  return [UIView new];
}

- (ABI29_0_0RCTShadowView *)shadowView
{
  return [ABI29_0_0RCTVirtualTextShadowView new];
}

@end
