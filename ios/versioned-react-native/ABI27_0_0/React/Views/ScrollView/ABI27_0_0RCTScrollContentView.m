/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTScrollContentView.h"

#import <ReactABI27_0_0/ABI27_0_0RCTAssert.h>
#import <ReactABI27_0_0/UIView+ReactABI27_0_0.h>

#import "ABI27_0_0RCTScrollView.h"

@implementation ABI27_0_0RCTScrollContentView

- (void)ReactABI27_0_0SetFrame:(CGRect)frame
{
  [super ReactABI27_0_0SetFrame:frame];

  ABI27_0_0RCTScrollView *scrollView = (ABI27_0_0RCTScrollView *)self.superview.superview;

  if (!scrollView) {
    return;
  }

  ABI27_0_0RCTAssert([scrollView isKindOfClass:[ABI27_0_0RCTScrollView class]],
            @"Unexpected view hierarchy of ABI27_0_0RCTScrollView component.");

  [scrollView updateContentOffsetIfNeeded];
}

@end
