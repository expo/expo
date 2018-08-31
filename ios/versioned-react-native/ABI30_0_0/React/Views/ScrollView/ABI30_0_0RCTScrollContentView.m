/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTScrollContentView.h"

#import <ReactABI30_0_0/ABI30_0_0RCTAssert.h>
#import <ReactABI30_0_0/UIView+ReactABI30_0_0.h>

#import "ABI30_0_0RCTScrollView.h"

@implementation ABI30_0_0RCTScrollContentView

- (void)ReactABI30_0_0SetFrame:(CGRect)frame
{
  [super ReactABI30_0_0SetFrame:frame];

  ABI30_0_0RCTScrollView *scrollView = (ABI30_0_0RCTScrollView *)self.superview.superview;

  if (!scrollView) {
    return;
  }

  ABI30_0_0RCTAssert([scrollView isKindOfClass:[ABI30_0_0RCTScrollView class]],
            @"Unexpected view hierarchy of ABI30_0_0RCTScrollView component.");

  [scrollView updateContentOffsetIfNeeded];
}

@end
