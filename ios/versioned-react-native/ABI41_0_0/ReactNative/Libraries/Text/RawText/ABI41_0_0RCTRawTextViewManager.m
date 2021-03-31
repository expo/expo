/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0React/ABI41_0_0RCTRawTextViewManager.h>

#import <ABI41_0_0React/ABI41_0_0RCTRawTextShadowView.h>

@implementation ABI41_0_0RCTRawTextViewManager

ABI41_0_0RCT_EXPORT_MODULE(ABI41_0_0RCTRawText)

- (UIView *)view
{
  return [UIView new];
}

- (ABI41_0_0RCTShadowView *)shadowView
{
  return [ABI41_0_0RCTRawTextShadowView new];
}

ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(text, NSString)

@end
