/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RCTSinglelineTextInputViewManager.h"

#import "ABI35_0_0RCTBaseTextInputShadowView.h"
#import "ABI35_0_0RCTSinglelineTextInputView.h"

@implementation ABI35_0_0RCTSinglelineTextInputViewManager

ABI35_0_0RCT_EXPORT_MODULE()

- (ABI35_0_0RCTShadowView *)shadowView
{
  ABI35_0_0RCTBaseTextInputShadowView *shadowView =
    (ABI35_0_0RCTBaseTextInputShadowView *)[super shadowView];

  shadowView.maximumNumberOfLines = 1;

  return shadowView;
}

- (UIView *)view
{
  return [[ABI35_0_0RCTSinglelineTextInputView alloc] initWithBridge:self.bridge];
}

@end
