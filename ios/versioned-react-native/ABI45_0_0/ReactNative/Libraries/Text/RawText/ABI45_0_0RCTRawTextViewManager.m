/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI45_0_0React/ABI45_0_0RCTRawTextViewManager.h>

#import <ABI45_0_0React/ABI45_0_0RCTRawTextShadowView.h>

@implementation ABI45_0_0RCTRawTextViewManager

ABI45_0_0RCT_EXPORT_MODULE(ABI45_0_0RCTRawText)

- (UIView *)view
{
  return [UIView new];
}

- (ABI45_0_0RCTShadowView *)shadowView
{
  return [ABI45_0_0RCTRawTextShadowView new];
}

ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(text, NSString)

@end
