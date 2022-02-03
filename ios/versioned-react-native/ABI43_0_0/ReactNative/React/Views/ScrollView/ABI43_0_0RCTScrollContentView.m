/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTScrollContentView.h"

#import <ABI43_0_0React/ABI43_0_0RCTAssert.h>
#import <ABI43_0_0React/ABI43_0_0UIView+React.h>

#import "ABI43_0_0RCTScrollView.h"

@implementation ABI43_0_0RCTScrollContentView

- (void)ABI43_0_0ReactSetFrame:(CGRect)frame
{
  [super ABI43_0_0ReactSetFrame:frame];

  ABI43_0_0RCTScrollView *scrollView = (ABI43_0_0RCTScrollView *)self.superview.superview;

  if (!scrollView) {
    return;
  }

  ABI43_0_0RCTAssert([scrollView isKindOfClass:[ABI43_0_0RCTScrollView class]], @"Unexpected view hierarchy of ABI43_0_0RCTScrollView component.");

  [scrollView updateContentOffsetIfNeeded];
}

@end
