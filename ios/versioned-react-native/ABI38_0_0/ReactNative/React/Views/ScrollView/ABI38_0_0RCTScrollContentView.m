/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTScrollContentView.h"

#import <ABI38_0_0React/ABI38_0_0RCTAssert.h>
#import <ABI38_0_0React/ABI38_0_0UIView+React.h>

#import "ABI38_0_0RCTScrollView.h"

@implementation ABI38_0_0RCTScrollContentView

- (void)ABI38_0_0ReactSetFrame:(CGRect)frame
{
  [super ABI38_0_0ReactSetFrame:frame];

  ABI38_0_0RCTScrollView *scrollView = (ABI38_0_0RCTScrollView *)self.superview.superview;

  if (!scrollView) {
    return;
  }

  ABI38_0_0RCTAssert([scrollView isKindOfClass:[ABI38_0_0RCTScrollView class]],
            @"Unexpected view hierarchy of ABI38_0_0RCTScrollView component.");

  [scrollView updateContentOffsetIfNeeded];
}

@end
