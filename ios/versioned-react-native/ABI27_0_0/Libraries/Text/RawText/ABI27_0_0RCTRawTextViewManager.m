/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTRawTextViewManager.h"

#import "ABI27_0_0RCTRawTextShadowView.h"

@implementation ABI27_0_0RCTRawTextViewManager

ABI27_0_0RCT_EXPORT_MODULE(ABI27_0_0RCTRawText)

- (UIView *)view
{
  return [UIView new];
}

- (ABI27_0_0RCTShadowView *)shadowView
{
  return [ABI27_0_0RCTRawTextShadowView new];
}

ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(text, NSString)

@end
