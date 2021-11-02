/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTSinglelineTextInputViewManager.h>

#import <ABI43_0_0React/ABI43_0_0RCTBaseTextInputShadowView.h>
#import <ABI43_0_0React/ABI43_0_0RCTSinglelineTextInputView.h>

@implementation ABI43_0_0RCTSinglelineTextInputViewManager

ABI43_0_0RCT_EXPORT_MODULE()

- (ABI43_0_0RCTShadowView *)shadowView
{
  ABI43_0_0RCTBaseTextInputShadowView *shadowView =
    (ABI43_0_0RCTBaseTextInputShadowView *)[super shadowView];

  shadowView.maximumNumberOfLines = 1;

  return shadowView;
}

- (UIView *)view
{
  return [[ABI43_0_0RCTSinglelineTextInputView alloc] initWithBridge:self.bridge];
}

@end
