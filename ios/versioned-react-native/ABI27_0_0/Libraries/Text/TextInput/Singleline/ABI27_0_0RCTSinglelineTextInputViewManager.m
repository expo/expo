/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTSinglelineTextInputViewManager.h"

#import "ABI27_0_0RCTBaseTextInputShadowView.h"
#import "ABI27_0_0RCTSinglelineTextInputView.h"

@implementation ABI27_0_0RCTSinglelineTextInputViewManager

ABI27_0_0RCT_EXPORT_MODULE()

- (ABI27_0_0RCTShadowView *)shadowView
{
  ABI27_0_0RCTBaseTextInputShadowView *shadowView =
    (ABI27_0_0RCTBaseTextInputShadowView *)[super shadowView];

  shadowView.maximumNumberOfLines = 1;

  return shadowView;
}

- (UIView *)view
{
  return [[ABI27_0_0RCTSinglelineTextInputView alloc] initWithBridge:self.bridge];
}

@end
