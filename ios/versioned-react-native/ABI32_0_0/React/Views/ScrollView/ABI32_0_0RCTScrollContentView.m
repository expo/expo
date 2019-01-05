/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTScrollContentView.h"

#import <ReactABI32_0_0/ABI32_0_0RCTAssert.h>
#import <ReactABI32_0_0/UIView+ReactABI32_0_0.h>

#import "ABI32_0_0RCTScrollView.h"

@implementation ABI32_0_0RCTScrollContentView

- (void)ReactABI32_0_0SetFrame:(CGRect)frame
{
  [super ReactABI32_0_0SetFrame:frame];

  ABI32_0_0RCTScrollView *scrollView = (ABI32_0_0RCTScrollView *)self.superview.superview;

  if (!scrollView) {
    return;
  }

  ABI32_0_0RCTAssert([scrollView isKindOfClass:[ABI32_0_0RCTScrollView class]],
            @"Unexpected view hierarchy of ABI32_0_0RCTScrollView component.");

  [scrollView updateContentOffsetIfNeeded];
}

@end
