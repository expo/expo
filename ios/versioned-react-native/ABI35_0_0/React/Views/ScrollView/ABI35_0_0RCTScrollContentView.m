/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RCTScrollContentView.h"

#import <ReactABI35_0_0/ABI35_0_0RCTAssert.h>
#import <ReactABI35_0_0/UIView+ReactABI35_0_0.h>

#import "ABI35_0_0RCTScrollView.h"

@implementation ABI35_0_0RCTScrollContentView

- (void)ReactABI35_0_0SetFrame:(CGRect)frame
{
  [super ReactABI35_0_0SetFrame:frame];

  ABI35_0_0RCTScrollView *scrollView = (ABI35_0_0RCTScrollView *)self.superview.superview;

  if (!scrollView) {
    return;
  }

  ABI35_0_0RCTAssert([scrollView isKindOfClass:[ABI35_0_0RCTScrollView class]],
            @"Unexpected view hierarchy of ABI35_0_0RCTScrollView component.");

  [scrollView updateContentOffsetIfNeeded];
}

@end
