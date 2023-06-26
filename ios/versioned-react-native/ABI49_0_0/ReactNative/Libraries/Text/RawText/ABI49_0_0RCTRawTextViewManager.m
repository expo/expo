/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTRawTextViewManager.h>

#import <ABI49_0_0React/ABI49_0_0RCTRawTextShadowView.h>

@implementation ABI49_0_0RCTRawTextViewManager

ABI49_0_0RCT_EXPORT_MODULE(ABI49_0_0RCTRawText)

- (UIView *)view
{
  return [UIView new];
}

- (ABI49_0_0RCTShadowView *)shadowView
{
  return [ABI49_0_0RCTRawTextShadowView new];
}

ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(text, NSString)

@end
