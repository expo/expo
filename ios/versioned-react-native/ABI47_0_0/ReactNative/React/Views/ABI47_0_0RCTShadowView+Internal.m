/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTShadowView+Layout.h"

@interface ABI47_0_0RCTShadowView () {
  __weak ABI47_0_0RCTRootShadowView *_rootView;
}

@end

@implementation ABI47_0_0RCTShadowView (Internal)

- (void)setRootView:(ABI47_0_0RCTRootShadowView *)rootView
{
  _rootView = rootView;
}

@end
