/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTScrollContentView.h"

#import <ABI45_0_0React/ABI45_0_0RCTAssert.h>
#import <ABI45_0_0React/ABI45_0_0UIView+React.h>

#import "ABI45_0_0RCTScrollView.h"

@implementation ABI45_0_0RCTScrollContentView

- (void)ABI45_0_0ReactSetFrame:(CGRect)frame
{
  [super ABI45_0_0ReactSetFrame:frame];

  ABI45_0_0RCTScrollView *scrollView = (ABI45_0_0RCTScrollView *)self.superview.superview;

  if (!scrollView) {
    return;
  }

  ABI45_0_0RCTAssert([scrollView isKindOfClass:[ABI45_0_0RCTScrollView class]], @"Unexpected view hierarchy of ABI45_0_0RCTScrollView component.");

  [scrollView updateContentSizeIfNeeded];
}

@end
