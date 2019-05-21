/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RCTScrollContentView.h"

#import <ReactABI33_0_0/ABI33_0_0RCTAssert.h>
#import <ReactABI33_0_0/UIView+ReactABI33_0_0.h>

#import "ABI33_0_0RCTScrollView.h"

@implementation ABI33_0_0RCTScrollContentView

- (void)ReactABI33_0_0SetFrame:(CGRect)frame
{
  [super ReactABI33_0_0SetFrame:frame];

  ABI33_0_0RCTScrollView *scrollView = (ABI33_0_0RCTScrollView *)self.superview.superview;

  if (!scrollView) {
    return;
  }

  ABI33_0_0RCTAssert([scrollView isKindOfClass:[ABI33_0_0RCTScrollView class]],
            @"Unexpected view hierarchy of ABI33_0_0RCTScrollView component.");

  [scrollView updateContentOffsetIfNeeded];
}

@end
