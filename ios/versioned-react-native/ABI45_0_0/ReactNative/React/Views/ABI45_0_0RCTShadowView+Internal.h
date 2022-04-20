/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI45_0_0React/ABI45_0_0RCTShadowView.h>

@class ABI45_0_0RCTRootShadowView;

@interface ABI45_0_0RCTShadowView (Internal)

@property (nonatomic, weak, readwrite) ABI45_0_0RCTRootShadowView *rootView;

@end
