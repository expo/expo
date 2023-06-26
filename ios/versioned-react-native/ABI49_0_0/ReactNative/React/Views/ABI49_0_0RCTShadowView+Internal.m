/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTShadowView+Layout.h"

@interface ABI49_0_0RCTShadowView () {
  __weak ABI49_0_0RCTRootShadowView *_rootView;
}

@end

@implementation ABI49_0_0RCTShadowView (Internal)

- (void)setRootView:(ABI49_0_0RCTRootShadowView *)rootView
{
  _rootView = rootView;
}

@end
