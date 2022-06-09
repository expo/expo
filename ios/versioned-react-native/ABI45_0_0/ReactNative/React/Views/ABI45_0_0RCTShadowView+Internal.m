/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTShadowView+Layout.h"

@interface ABI45_0_0RCTShadowView () {
  __weak ABI45_0_0RCTRootShadowView *_rootView;
}

@end

@implementation ABI45_0_0RCTShadowView (Internal)

- (void)setRootView:(ABI45_0_0RCTRootShadowView *)rootView
{
  _rootView = rootView;
}

@end
