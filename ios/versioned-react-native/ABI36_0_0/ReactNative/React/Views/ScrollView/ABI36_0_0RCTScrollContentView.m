/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RCTScrollContentView.h"

#import <ABI36_0_0React/ABI36_0_0RCTAssert.h>
#import <ABI36_0_0React/ABI36_0_0UIView+React.h>

#import "ABI36_0_0RCTScrollView.h"

@implementation ABI36_0_0RCTScrollContentView

- (void)ABI36_0_0ReactSetFrame:(CGRect)frame
{
  [super ABI36_0_0ReactSetFrame:frame];

  ABI36_0_0RCTScrollView *scrollView = (ABI36_0_0RCTScrollView *)self.superview.superview;

  if (!scrollView) {
    return;
  }

  ABI36_0_0RCTAssert([scrollView isKindOfClass:[ABI36_0_0RCTScrollView class]],
            @"Unexpected view hierarchy of ABI36_0_0RCTScrollView component.");

  [scrollView updateContentOffsetIfNeeded];
}

@end
