/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTSinglelineTextInputViewManager.h"

#import "ABI28_0_0RCTBaseTextInputShadowView.h"
#import "ABI28_0_0RCTSinglelineTextInputView.h"

@implementation ABI28_0_0RCTSinglelineTextInputViewManager

ABI28_0_0RCT_EXPORT_MODULE()

- (ABI28_0_0RCTShadowView *)shadowView
{
  ABI28_0_0RCTBaseTextInputShadowView *shadowView =
    (ABI28_0_0RCTBaseTextInputShadowView *)[super shadowView];

  shadowView.maximumNumberOfLines = 1;

  return shadowView;
}

- (UIView *)view
{
  return [[ABI28_0_0RCTSinglelineTextInputView alloc] initWithBridge:self.bridge];
}

@end
