/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTSinglelineTextInputViewManager.h"

#import "ABI29_0_0RCTBaseTextInputShadowView.h"
#import "ABI29_0_0RCTSinglelineTextInputView.h"

@implementation ABI29_0_0RCTSinglelineTextInputViewManager

ABI29_0_0RCT_EXPORT_MODULE()

- (ABI29_0_0RCTShadowView *)shadowView
{
  ABI29_0_0RCTBaseTextInputShadowView *shadowView =
    (ABI29_0_0RCTBaseTextInputShadowView *)[super shadowView];

  shadowView.maximumNumberOfLines = 1;

  return shadowView;
}

- (UIView *)view
{
  return [[ABI29_0_0RCTSinglelineTextInputView alloc] initWithBridge:self.bridge];
}

@end
