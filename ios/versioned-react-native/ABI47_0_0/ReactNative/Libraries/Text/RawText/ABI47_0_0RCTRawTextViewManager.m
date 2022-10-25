/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTRawTextViewManager.h>

#import <ABI47_0_0React/ABI47_0_0RCTRawTextShadowView.h>

@implementation ABI47_0_0RCTRawTextViewManager

ABI47_0_0RCT_EXPORT_MODULE(ABI47_0_0RCTRawText)

- (UIView *)view
{
  return [UIView new];
}

- (ABI47_0_0RCTShadowView *)shadowView
{
  return [ABI47_0_0RCTRawTextShadowView new];
}

ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(text, NSString)

@end
