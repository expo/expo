/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTVirtualTextShadowView.h"

#import <ReactABI34_0_0/ABI34_0_0RCTShadowView+Layout.h>
#import <ABI34_0_0yoga/ABI34_0_0Yoga.h>

#import "ABI34_0_0RCTRawTextShadowView.h"

@implementation ABI34_0_0RCTVirtualTextShadowView {
  BOOL _isLayoutDirty;
}

#pragma mark - Layout

- (void)dirtyLayout
{
  [super dirtyLayout];

  if (_isLayoutDirty) {
    return;
  }
  _isLayoutDirty = YES;

  [self.superview dirtyLayout];
}

- (void)clearLayout
{
  _isLayoutDirty = NO;
}

@end
