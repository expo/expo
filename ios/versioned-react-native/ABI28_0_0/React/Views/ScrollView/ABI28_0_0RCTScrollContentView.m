/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTScrollContentView.h"

#import <ReactABI28_0_0/ABI28_0_0RCTAssert.h>
#import <ReactABI28_0_0/UIView+ReactABI28_0_0.h>

#import "ABI28_0_0RCTScrollView.h"

@implementation ABI28_0_0RCTScrollContentView

- (void)ReactABI28_0_0SetFrame:(CGRect)frame
{
  [super ReactABI28_0_0SetFrame:frame];

  ABI28_0_0RCTScrollView *scrollView = (ABI28_0_0RCTScrollView *)self.superview.superview;

  if (!scrollView) {
    return;
  }

  ABI28_0_0RCTAssert([scrollView isKindOfClass:[ABI28_0_0RCTScrollView class]],
            @"Unexpected view hierarchy of ABI28_0_0RCTScrollView component.");

  [scrollView updateContentOffsetIfNeeded];
}

@end
