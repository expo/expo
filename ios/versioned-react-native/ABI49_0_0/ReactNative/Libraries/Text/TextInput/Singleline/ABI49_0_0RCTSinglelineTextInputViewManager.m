/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTSinglelineTextInputViewManager.h>

#import <ABI49_0_0React/ABI49_0_0RCTBaseTextInputShadowView.h>
#import <ABI49_0_0React/ABI49_0_0RCTSinglelineTextInputView.h>

@implementation ABI49_0_0RCTSinglelineTextInputViewManager

ABI49_0_0RCT_EXPORT_MODULE()

- (ABI49_0_0RCTShadowView *)shadowView
{
  ABI49_0_0RCTBaseTextInputShadowView *shadowView = (ABI49_0_0RCTBaseTextInputShadowView *)[super shadowView];

  shadowView.maximumNumberOfLines = 1;

  return shadowView;
}

- (UIView *)view
{
  return [[ABI49_0_0RCTSinglelineTextInputView alloc] initWithBridge:self.bridge];
}

@end
