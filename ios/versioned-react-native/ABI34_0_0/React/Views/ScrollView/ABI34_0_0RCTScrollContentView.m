/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTScrollContentView.h"

#import <ReactABI34_0_0/ABI34_0_0RCTAssert.h>
#import <ReactABI34_0_0/UIView+ReactABI34_0_0.h>

#import "ABI34_0_0RCTScrollView.h"

@implementation ABI34_0_0RCTScrollContentView

- (void)ReactABI34_0_0SetFrame:(CGRect)frame
{
  [super ReactABI34_0_0SetFrame:frame];

  ABI34_0_0RCTScrollView *scrollView = (ABI34_0_0RCTScrollView *)self.superview.superview;

  if (!scrollView) {
    return;
  }

  ABI34_0_0RCTAssert([scrollView isKindOfClass:[ABI34_0_0RCTScrollView class]],
            @"Unexpected view hierarchy of ABI34_0_0RCTScrollView component.");

  [scrollView updateContentOffsetIfNeeded];
}

@end
