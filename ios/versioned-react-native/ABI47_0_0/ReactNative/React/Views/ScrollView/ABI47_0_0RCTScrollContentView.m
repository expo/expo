/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTScrollContentView.h"

#import <ABI47_0_0React/ABI47_0_0RCTAssert.h>
#import <ABI47_0_0React/ABI47_0_0UIView+React.h>

#import "ABI47_0_0RCTScrollView.h"

@implementation ABI47_0_0RCTScrollContentView

- (void)ABI47_0_0ReactSetFrame:(CGRect)frame
{
  [super ABI47_0_0ReactSetFrame:frame];

  ABI47_0_0RCTScrollView *scrollView = (ABI47_0_0RCTScrollView *)self.superview.superview;

  if (!scrollView) {
    return;
  }

  ABI47_0_0RCTAssert([scrollView isKindOfClass:[ABI47_0_0RCTScrollView class]], @"Unexpected view hierarchy of ABI47_0_0RCTScrollView component.");

  [scrollView updateContentSizeIfNeeded];
}

@end
