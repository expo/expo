/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI44_0_0React/ABI44_0_0RCTRawTextViewManager.h>

#import <ABI44_0_0React/ABI44_0_0RCTRawTextShadowView.h>

@implementation ABI44_0_0RCTRawTextViewManager

ABI44_0_0RCT_EXPORT_MODULE(ABI44_0_0RCTRawText)

- (UIView *)view
{
  return [UIView new];
}

- (ABI44_0_0RCTShadowView *)shadowView
{
  return [ABI44_0_0RCTRawTextShadowView new];
}

ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(text, NSString)

@end
