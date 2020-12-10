/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RCTShadowView+Layout.h"

@interface ABI39_0_0RCTShadowView () {
  __weak ABI39_0_0RCTRootShadowView *_rootView;
}

@end

@implementation ABI39_0_0RCTShadowView (Internal)

- (void)setRootView:(ABI39_0_0RCTRootShadowView *)rootView
{
  _rootView = rootView;
}

@end
