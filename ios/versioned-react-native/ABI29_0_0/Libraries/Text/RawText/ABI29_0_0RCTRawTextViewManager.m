/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTRawTextViewManager.h"

#import "ABI29_0_0RCTRawTextShadowView.h"

@implementation ABI29_0_0RCTRawTextViewManager

ABI29_0_0RCT_EXPORT_MODULE(ABI29_0_0RCTRawText)

- (UIView *)view
{
  return [UIView new];
}

- (ABI29_0_0RCTShadowView *)shadowView
{
  return [ABI29_0_0RCTRawTextShadowView new];
}

ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(text, NSString)

@end
