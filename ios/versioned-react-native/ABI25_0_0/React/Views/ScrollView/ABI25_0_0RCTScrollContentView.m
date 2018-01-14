/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTScrollContentView.h"

#import <ReactABI25_0_0/ABI25_0_0RCTAssert.h>
#import <ReactABI25_0_0/UIView+ReactABI25_0_0.h>

#import "ABI25_0_0RCTScrollView.h"

@implementation ABI25_0_0RCTScrollContentView

- (void)ReactABI25_0_0SetFrame:(CGRect)frame
{
  [super ReactABI25_0_0SetFrame:frame];

  ABI25_0_0RCTScrollView *scrollView = (ABI25_0_0RCTScrollView *)self.superview.superview;

  if (!scrollView) {
    return;
  }

  ABI25_0_0RCTAssert([scrollView isKindOfClass:[ABI25_0_0RCTScrollView class]],
            @"Unexpected view hierarchy of ABI25_0_0RCTScrollView component.");

  [scrollView updateContentOffsetIfNeeded];
}

@end
