/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTScrollContentView.h"

#import <ReactABI29_0_0/ABI29_0_0RCTAssert.h>
#import <ReactABI29_0_0/UIView+ReactABI29_0_0.h>

#import "ABI29_0_0RCTScrollView.h"

@implementation ABI29_0_0RCTScrollContentView

- (void)ReactABI29_0_0SetFrame:(CGRect)frame
{
  [super ReactABI29_0_0SetFrame:frame];

  ABI29_0_0RCTScrollView *scrollView = (ABI29_0_0RCTScrollView *)self.superview.superview;

  if (!scrollView) {
    return;
  }

  ABI29_0_0RCTAssert([scrollView isKindOfClass:[ABI29_0_0RCTScrollView class]],
            @"Unexpected view hierarchy of ABI29_0_0RCTScrollView component.");

  [scrollView updateContentOffsetIfNeeded];
}

@end
