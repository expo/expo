/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI39_0_0React/ABI39_0_0RCTSinglelineTextInputViewManager.h>

#import <ABI39_0_0React/ABI39_0_0RCTBaseTextInputShadowView.h>
#import <ABI39_0_0React/ABI39_0_0RCTSinglelineTextInputView.h>

@implementation ABI39_0_0RCTSinglelineTextInputViewManager

ABI39_0_0RCT_EXPORT_MODULE()

- (ABI39_0_0RCTShadowView *)shadowView
{
  ABI39_0_0RCTBaseTextInputShadowView *shadowView =
    (ABI39_0_0RCTBaseTextInputShadowView *)[super shadowView];

  shadowView.maximumNumberOfLines = 1;

  return shadowView;
}

- (UIView *)view
{
  return [[ABI39_0_0RCTSinglelineTextInputView alloc] initWithBridge:self.bridge];
}

@end
