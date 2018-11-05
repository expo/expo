/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTSinglelineTextInputViewManager.h"

#import "ABI26_0_0RCTBaseTextInputShadowView.h"
#import "ABI26_0_0RCTSinglelineTextInputView.h"

@implementation ABI26_0_0RCTSinglelineTextInputViewManager

ABI26_0_0RCT_EXPORT_MODULE()

- (ABI26_0_0RCTShadowView *)shadowView
{
  ABI26_0_0RCTBaseTextInputShadowView *shadowView =
    (ABI26_0_0RCTBaseTextInputShadowView *)[super shadowView];

  shadowView.maximumNumberOfLines = 1;

  return shadowView;
}

- (UIView *)view
{
  return [[ABI26_0_0RCTSinglelineTextInputView alloc] initWithBridge:self.bridge];
}

@end
