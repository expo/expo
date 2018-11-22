/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTScrollContentView.h"

#import <ReactABI31_0_0/ABI31_0_0RCTAssert.h>
#import <ReactABI31_0_0/UIView+ReactABI31_0_0.h>

#import "ABI31_0_0RCTScrollView.h"

@implementation ABI31_0_0RCTScrollContentView

- (void)ReactABI31_0_0SetFrame:(CGRect)frame
{
  [super ReactABI31_0_0SetFrame:frame];

  ABI31_0_0RCTScrollView *scrollView = (ABI31_0_0RCTScrollView *)self.superview.superview;

  if (!scrollView) {
    return;
  }

  ABI31_0_0RCTAssert([scrollView isKindOfClass:[ABI31_0_0RCTScrollView class]],
            @"Unexpected view hierarchy of ABI31_0_0RCTScrollView component.");

  [scrollView updateContentOffsetIfNeeded];
}

@end
