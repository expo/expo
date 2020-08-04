/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTScrollContentView.h"

#import <ABI37_0_0React/ABI37_0_0RCTAssert.h>
#import <ABI37_0_0React/ABI37_0_0UIView+React.h>

#import "ABI37_0_0RCTScrollView.h"

@implementation ABI37_0_0RCTScrollContentView

- (void)ABI37_0_0ReactSetFrame:(CGRect)frame
{
  [super ABI37_0_0ReactSetFrame:frame];

  ABI37_0_0RCTScrollView *scrollView = (ABI37_0_0RCTScrollView *)self.superview.superview;

  if (!scrollView) {
    return;
  }

  ABI37_0_0RCTAssert([scrollView isKindOfClass:[ABI37_0_0RCTScrollView class]],
            @"Unexpected view hierarchy of ABI37_0_0RCTScrollView component.");

  [scrollView updateContentOffsetIfNeeded];
}

@end
